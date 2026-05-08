import { useCallback, useRef, useState } from 'react'

const computeDiff = <T extends Record<string, unknown>>(initial: T | undefined, current: T | undefined): Set<string> => {
  if (!initial || !current) return new Set()
  const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])
  const changed = new Set<string>()
  for (const key of allKeys) {
    if (JSON.stringify(current[key]) !== JSON.stringify(initial[key])) {
      changed.add(key)
    }
  }
  return changed
}

export const useFormChanges = <T extends Record<string, unknown>>(initialValues: T | undefined, currentValues?: T) => {
  const initialValuesRef = useRef(initialValues)
  const [changedFields, setChangedFields] = useState<Set<string>>(() =>
    (initialValues && currentValues) ? computeDiff(initialValues, currentValues) : new Set()
  )

  const getFieldStyles = (fieldPath: string | string[], hasError?: boolean) => {
    const paths = Array.isArray(fieldPath) ? fieldPath : [fieldPath]
    const changed = paths.some(p => changedFields.has(p))
    return {
      input: {
        borderColor: hasError ? 'var(--mantine-color-red-6)' : changed ? '#fece02' : undefined,
        borderWidth: (hasError || changed) ? 2 : 1,
      }
    }
  }

  const onFormValuesChange = useCallback((updatedValues: T) => {
    const initial = initialValuesRef.current
    if (!updatedValues || !initial) {
      setChangedFields(new Set())
      return
    }
    const changed = computeDiff(initial, updatedValues)
    setChangedFields(prev => {
      if (prev.size === changed.size && [...prev].every(k => changed.has(k))) return prev
      return changed
    })
  }, [])

  const hasFormChanges = changedFields.size > 0

  const resetInitialValues = useCallback((newInitial: T) => {
    initialValuesRef.current = newInitial
    setChangedFields(new Set())
  }, [])

  return {
    hasFormChanges,
    changedFields,
    getFieldStyles,
    onFormValuesChange,
    resetInitialValues,
  }
}
