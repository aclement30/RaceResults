import { useMemo } from 'react'

export const useFormChanges = <T>(formValues: T, initialValues: T) => {
  // Track which fields have changed from initial values
  const hasFieldChanged = (fieldPath: string) => {
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    const currentValue = getNestedValue(formValues, fieldPath)
    const initialValue = getNestedValue(initialValues, fieldPath)

    return JSON.stringify(currentValue) !== JSON.stringify(initialValue)
  }

  // Check if any field in the form has changed
  const hasFormChanges = useMemo(() => {
    return JSON.stringify(formValues) !== JSON.stringify(initialValues)
  }, [formValues, initialValues])

  const getFieldStyles = (fieldPath: string) => ({
    input: {
      borderColor: hasFieldChanged(fieldPath) ? '#fece02' : undefined,
      borderWidth: hasFieldChanged(fieldPath) ? 2 : 1,
    }
  })

  return {
    hasFieldChanged,
    hasFormChanges,
    getFieldStyles,
  }
}