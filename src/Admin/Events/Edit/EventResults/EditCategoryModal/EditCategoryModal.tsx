import { Button, Group, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import React, { useMemo, useRef, useState } from 'react'
import type { TGender } from '../../../../../../shared/types/athletes'
import type { BaseCategory } from '../../../../../../shared/types/events'
import { RequireAdmin } from '../../../../Shared/RequireAdmin/RequireAdmin'
import { useFormChanges } from '../../../../utils/useFormChanges'

const MODAL_ID = 'edit-category-modal'

export const openEditCategoryModal = (props: EditCategoryModalProps) => {
  modals.open({
    modalId: MODAL_ID,
    title: props.category ? 'Edit Category' : 'Add Category',
    size: 'sm',
    children: (
      <EditCategoryModal {...props}/>
    ),
  })
}

type EditCategoryModalProps = {
  category: BaseCategory | null
  existingCategories: BaseCategory[]
  onSubmit: (data: BaseCategory) => Promise<void>
}

type FormValues = {
  label: string
  alias: string
  gender: TGender
  parentCategory: string | null
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  category,
  existingCategories,
  onSubmit,
}) => {
  const aliasManuallyEdited = useRef(!!category)
  const [saving, setSaving] = useState(false)
  const others = existingCategories.filter(c => c.alias !== category?.alias)

  const initialValues: FormValues = useMemo(() => ({
    label: category?.label ?? '',
    alias: category?.alias ?? '',
    gender: category?.gender ?? 'M',
    parentCategory: category?.parentCategory ?? null,
  }), [category])

  const { getFieldStyles, onFormValuesChange } = useFormChanges(initialValues)

  const form = useForm<FormValues>({
    initialValues,
    onValuesChange: onFormValuesChange,
    validate: {
      label: (value) => {
        if (!value.trim()) return 'Category name is required'
        if (others.some(c => c.label.toLowerCase() === value.trim().toLowerCase())) return 'A category with this name already exists'
        return null
      },
      alias: (value, values) => {
        const resolved = value.trim() || values.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        if (others.some(c => c.alias === resolved)) return `The alias "${resolved}" is already used by another category`
        return null
      },
    },
  })

  const handleLabelChange = (value: string) => {
    form.setFieldValue('label', value)
    if (!aliasManuallyEdited.current) {
      form.setFieldValue('alias', value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }

  const handleClose = () => modals.close(MODAL_ID)

  const handleSubmit = async (values: FormValues) => {
    const resolvedAlias = values.alias.trim() || values.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    try {
      setSaving(true)

      await onSubmit({
        label: values.label.trim(),
        alias: resolvedAlias,
        gender: values.gender,
        parentCategory: values.parentCategory ?? undefined,
      })

      handleClose()
    } catch (error) {
      // Error handling is done in the parent component's onSubmit function, so we don't need to do anything here
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Category Name"
          placeholder="e.g. Men Elite"
          required
          styles={getFieldStyles('label', !!form.errors.label)}
          {...form.getInputProps('label')}
          onChange={e => handleLabelChange(e.target.value)}
        />

        <RequireAdmin>
          <TextInput
            label="Alias"
            placeholder="e.g. men-elite"
            required
            styles={getFieldStyles('alias', !!form.errors.alias)}
            {...form.getInputProps('alias')}
            onChange={e => {
              aliasManuallyEdited.current = true
              form.setFieldValue('alias', e.target.value)
            }}
          />
        </RequireAdmin>

        <Select
          label="Gender"
          required
          allowDeselect={false}
          styles={getFieldStyles('gender')}
          data={[
            { value: 'M', label: 'Men' },
            { value: 'F', label: 'Women' },
            { value: 'X', label: 'Mixed' },
          ]}
          {...form.getInputProps('gender')}
        />

        <Select
          label="Parent Category"
          placeholder="None"
          clearable
          styles={getFieldStyles('parentCategory', !!form.errors.parentCategory)}
          data={others.map(c => ({ value: c.alias, label: c.label }))}
          {...form.getInputProps('parentCategory')}
        />

        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={!form.values.label.trim()} loading={saving}>
            {category ? 'Save' : 'Create'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
