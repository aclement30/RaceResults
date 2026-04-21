import { Box, Button, Collapse, Divider, Flex, Group, Paper, SegmentedControl, Text, } from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { IconChevronDown, IconChevronUp, IconDatabaseImport, IconRotate, IconUpload, } from '@tabler/icons-react'
import React, { useEffect, useRef, useState } from 'react'
import type {
  BaseCategory,
  CreateEventCategory,
  EventCategory,
  EventResults as TEventResults,
  ParticipantResult,
  RaceEvent,
} from '../../../../../shared/types'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import { showSuccessMessage } from '../../../../utils/showSuccessMessage'
import { CategorySidebar } from '../../../Shared/CategorySidebar/CategorySidebar'
import { adminApi } from '../../../utils/api'
import { CategoryDetailPanel } from './CategoryDetailPanel/CategoryDetailPanel'
import { openEditCategoryModal } from './EditCategoryModal/EditCategoryModal'
import { openEventFileUploadModal } from './FileUploadModal/FileUploadModal'
import { ResultsFormContext, type ResultsFormValues } from './ResultsFormContext'
import { PrimesTable } from './ResultsTable/PrimesTable'
import { type ColumnKey, detectColumns, ResultsTable } from './ResultsTable/ResultsTable'

type EventResultsProps = {
  results: TEventResults
  year: number
  eventHash: string
  event: RaceEvent
  onEventChange: () => void
}

export const EventResults: React.FC<EventResultsProps> = ({ results, year, eventHash, event, onEventChange }) => {
  const [categories, setCategories] = useState<CreateEventCategory[]>(results.categories as CreateEventCategory[])
  const [activeCategory, setActiveCategory] = useState<string | null>(results.categories?.length ? results.categories[0].alias : null)
  const [dirtyCategories, setDirtyCategories] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'primes'>('results')
  const [resultsTabDirty, setResultsTabDirty] = useState(false)
  const [primesTabDirty, setPrimesTabDirty] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailPanelResetKey, setDetailPanelResetKey] = useState(0)

  const currentCategory = categories.find(c => c.alias === activeCategory)

  const handleDirtyChangeRef = useRef<(isDirty: boolean) => void>(() => {})

  const categoryDetailValues = (cat: CreateEventCategory | undefined) => ({
    primes: cat?.primes ?? [],
    startTime: cat?.startTime ?? null,
    starters: cat?.starters ?? 0,
    finishers: cat?.finishers ?? 0,
    laps: cat?.laps ?? null,
    lapDistanceKm: cat?.lapDistanceKm ?? null,
    raceDistanceKm: cat?.raceDistanceKm ?? null,
    corrections: cat?.corrections ?? '',
  })

  const form = useForm<ResultsFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      results: (currentCategory?.results ?? []) as ParticipantResult[],
      ...categoryDetailValues(currentCategory),
    },
    onValuesChange: () => {
      handleDirtyChangeRef.current(form.isDirty())
    },
    validate: {
      results: {
        bibNumber: (v) => (v != null && (v as number) <= 0) ? 'Bib must be a positive number' : null,
        firstName: (v) => (!v || !(v as string).trim()) ? 'Name is required' : null,
        uciId: (v) => (v && (v as string).length !== 11) ? 'UCI ID must be 11 characters' : null,
        avgSpeed: (v) => (v != null && (v as number) < 0) ? 'Speed must be positive' : null,
        status: (v) => (!v) ? 'Status is required' : null,
      }
    }
  })

  const formRef = useRef(form)
  formRef.current = form

  // Always points to the latest handler so onValuesChange (defined at form creation) sees current state
  handleDirtyChangeRef.current = (isDirty: boolean) => {
    if (!activeCategory) return
    setDirtyCategories(prev => {
      if (isDirty === prev.has(activeCategory)) return prev
      const next = new Set(prev)
      if (isDirty) next.add(activeCategory)
      else next.delete(activeCategory)
      return next
    })
    const newResultsDirty = formRef.current.isDirty('results')
    const newPrimesDirty = formRef.current.isDirty('primes')
    setResultsTabDirty(prev => prev === newResultsDirty ? prev : newResultsDirty)
    setPrimesTabDirty(prev => prev === newPrimesDirty ? prev : newPrimesDirty)
  }

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() =>
    detectColumns(currentCategory?.results ?? [])
  )

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Sync form when active category changes
  useEffect(() => {
    const newResults = (currentCategory?.results ?? []) as ParticipantResult[]
    const newValues = {
      results: newResults,
      ...categoryDetailValues(currentCategory),
    }
    formRef.current.resetDirty(newValues)
    formRef.current.setValues(newValues)
    setVisibleColumns(detectColumns(newResults))
    setDetailsOpen(false)
    setResultsTabDirty(false)
    setPrimesTabDirty(false)
  }, [activeCategory])

  const handleOpenFileUpload = () => {
    const activeCategoryLabel = currentCategory?.label ?? ''
    const hasExistingResults = !!(activeCategory && currentCategory?.results.length)

    openEventFileUploadModal({
      activeCategoryLabel,
      hasExistingResults,
      onImport: handleFileImport,
    })
  }

  const handleReimport = async () => {
    try {
      setImporting(true)

      const importResult = await adminApi.run.resultProcessor({ runType: 'event', year, eventHash })

      showSuccessMessage({
        title: 'Import successful',
        message: `Results re-imported successfully. Processing took ${Math.round(importResult.durationMs / 1000)} seconds.`,
      })

      onEventChange()
    } catch (error) {
      showErrorMessage({ message: `Failed to re-import results: ${(error as Error).message}`, title: 'Import Error' })
    } finally {
      setImporting(false)
    }
  }

  const handleOpenEditCategoryModal = (originalAlias?: string) => {
    const existingCategory = originalAlias ? categories.find(c => c.alias === originalAlias) ?? null : null

    openEditCategoryModal({
      category: existingCategory,
      existingCategories: categories,
      onSubmit: async (updatedBaseCategory: BaseCategory) => {
        if (existingCategory) {
          const updatedCategory: CreateEventCategory = { ...existingCategory, ...updatedBaseCategory }

          await handleSaveCategory(updatedCategory, updatedCategory.results, originalAlias)
        } else {
          await handleSaveCategory(updatedBaseCategory, [])
        }
      },
    })
  }

  const handleFileImport = (results: ParticipantResult[]) => {
    setCategories(prev => {
      return prev.map(c => c.alias === activeCategory ? { ...c, results } : c)
    })
  }

  const doDeleteCategory = async (alias: string) => {
    try {
      await adminApi.delete.eventResultCategory(alias, { year, eventHash })

      setCategories(prev => {
        const remaining = prev.filter(c => c.alias !== alias)
        if (activeCategory === alias) setActiveCategory(remaining[0]?.alias ?? null)
        return remaining
      })

      setDirtyCategories(prev => {
        const next = new Set(prev)
        next.delete(alias)
        return next
      })
    } catch (error) {
      showErrorMessage({ message: `Failed to delete category: ${(error as Error).message}`, title: 'Delete Error' })
      return
    }
  }

  const handleDeleteCategory = (alias: string) => {
    const cat = categories.find(c => c.alias === alias)
    if (!cat) return

    if (cat.results.length > 0) {
      const modalId = modals.openConfirmModal({
        title: 'Delete category',
        children: (
          <Text size="sm">
            <strong>{cat.label}</strong> has {cat.results.length} result{cat.results.length !== 1 ? 's' : ''}.
            Are you sure you want to delete it? This action cannot be undone.
          </Text>
        ),
        labels: { confirm: 'Delete', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        closeOnConfirm: false,
        onConfirm: async () => {
          modals.updateModal({
            modalId,
            confirmProps: { color: 'red', loading: true },
            cancelProps: { disabled: true }
          })
          await doDeleteCategory(alias)
          modals.close(modalId)
        },
      })
    } else {
      doDeleteCategory(alias)
    }
  }

  const handleCategoryChange = (updates: Partial<CreateEventCategory>) => {
    if (!activeCategory) return

    setCategories(prev =>
      prev.map(category => category.alias === activeCategory ? { ...category, ...updates } : category)
    )
  }

  const handleSaveCategory = async (
    category: BaseCategory | CreateEventCategory,
    results: ParticipantResult[],
    originalAlias?: string
  ): Promise<EventCategory> => {
    try {
      let updatedCategory: EventCategory
      if (originalAlias) {
        const updatePayload: CreateEventCategory = {
          ...category as CreateEventCategory,
          results,
        }

        updatedCategory = await adminApi.update.eventResultCategory(updatePayload, { year, eventHash })
      } else {
        updatedCategory = await adminApi.create.eventResultCategory(category, { year, eventHash })
      }

      if (originalAlias) {
        // Existing category - replace category in categories list with updated category (including new alias)
        setCategories(prev =>
          prev.map(c => c.alias === originalAlias ? { ...c, ...updatedCategory, alias: category.alias } : c)
        )
      } else {
        // New category - add new category to categories list
        setCategories(prev =>
          [...prev, updatedCategory as CreateEventCategory]
        )
      }

      setActiveCategory(category.alias)

      return updatedCategory
    } catch (err) {
      showErrorMessage({ message: `Failed to save category results: ${(err as Error).message}`, title: 'Save Error' })
      throw err
    }
  }

  const handleSaveResults = async () => {
    if (!currentCategory) return

    const { hasErrors } = formRef.current.validate()
    if (hasErrors) return

    try {
      setSaving(true)

      const {
        results,
        primes,
        startTime,
        starters,
        finishers,
        laps,
        lapDistanceKm,
        raceDistanceKm,
        corrections
      } = formRef.current.getValues()
      const categoryWithDetails: CreateEventCategory = {
        ...currentCategory,
        userLocked: true,
        primes,
        startTime: startTime ?? undefined,
        starters: typeof starters === 'number' ? starters : 0,
        finishers: typeof finishers === 'number' ? finishers : 0,
        laps: typeof laps === 'number' ? laps : undefined,
        lapDistanceKm: typeof lapDistanceKm === 'number' ? lapDistanceKm : undefined,
        raceDistanceKm: typeof raceDistanceKm === 'number' ? raceDistanceKm : undefined,
        corrections: corrections || undefined,
      }

      const updatedCategory = await handleSaveCategory(categoryWithDetails, results, currentCategory.alias)

      const newValues = { results: updatedCategory.results, ...categoryDetailValues(updatedCategory as CreateEventCategory) }
      if (updatedCategory.alias === activeCategory) {
        formRef.current.resetDirty(newValues)
        formRef.current.setValues(newValues)
      }

      setDirtyCategories(prev => {
        const next = new Set(prev)
        next.delete(currentCategory.alias)
        return next
      })
    } catch (err) {
      // Error handling is done in handleSaveCategory, so we don't need to do anything here
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    modals.openConfirmModal({
      title: 'Reset changes',
      children: (
        <Text size="sm">
          Discard all changes to <strong>{currentCategory?.label}</strong>?
        </Text>
      ),
      labels: { confirm: 'Reset', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        formRef.current.reset()
        // form.reset() does not trigger onValuesChange — manually clear dirty state
        handleDirtyChangeRef.current(false)
        setDetailPanelResetKey(k => k + 1)
      },
    })
  }

  const confirmIfDirty = (onConfirm: () => void) => {
    if (activeCategory && dirtyCategories.has(activeCategory)) {
      const label = categories.find(c => c.alias === activeCategory)?.label
      modals.openConfirmModal({
        title: 'Unsaved changes',
        children: (
          <Text size="sm">
            <strong>{label}</strong> has unsaved changes. Switch anyway and discard them?
          </Text>
        ),
        labels: { confirm: 'Switch anyway', cancel: 'Stay' },
        confirmProps: { color: 'red' },
        onConfirm: () => {
          setDirtyCategories(prev => {
            const next = new Set(prev)
            next.delete(activeCategory)
            return next
          })
          onConfirm()
        },
      })
    } else {
      onConfirm()
    }
  }

  const handleSelectCategory = (alias: string) => {
    if (alias === activeCategory) return
    confirmIfDirty(() => setActiveCategory(alias))
  }

  const handleReorderCategories = async (orderedCategories: CreateEventCategory[]) => {
    setCategories(orderedCategories)

    try {
      await adminApi.update.eventResultCategoriesOrder(orderedCategories.map(c => c.alias), { year, eventHash })
    } catch (err) {
      setCategories(categories) // revert on failure
      showErrorMessage({ message: `Failed to save category order: ${(err as Error).message}`, title: 'Save Error' })
    }
  }

  const handleAddCategory = () => {
    confirmIfDirty(() => handleOpenEditCategoryModal())
  }

  return (
    <ResultsFormContext.Provider value={formRef}>
      <Box>
        <Group mb="md">
          <Button leftSection={<IconUpload size={16}/>} onClick={handleOpenFileUpload}>
            Upload File
          </Button>

          {event.source === 'ingest' && (
            <Button
              variant="outline"
              leftSection={<IconDatabaseImport size={16}/>}
              onClick={handleReimport}
              loading={importing}
            >
              Re-import
            </Button>
          )}
        </Group>
        <Divider mb="md"/>

        <Flex gap="md" align="stretch">
          <CategorySidebar
            categories={categories}
            activeCategory={activeCategory}
            dirtyCategories={dirtyCategories}
            onSelectCategory={handleSelectCategory}
            onEditCategory={handleOpenEditCategoryModal}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
            onAddCategory={handleAddCategory}
          />

          <Divider orientation="vertical"/>

          <Box style={{ flex: 1 }}>
            {currentCategory && (
              <Group mb="md" justify="space-between">
                <Group>
                  <Text size="lg" fw={500}>{currentCategory.label}</Text>

                  <SegmentedControl
                    size="sm"
                    value={activeTab}
                    onChange={v => setActiveTab(v as 'results' | 'primes')}
                    data={[
                      {
                        value: 'results',
                        label: (
                          <Group gap={6} wrap="nowrap">
                            Results
                            {resultsTabDirty && <Box w={6} h={6} style={{
                              borderRadius: '50%',
                              backgroundColor: '#fece02',
                              flexShrink: 0
                            }}/>}
                          </Group>
                        ),
                      },
                      {
                        value: 'primes',
                        label: (
                          <Group gap={6} wrap="nowrap">
                            Primes
                            {primesTabDirty && <Box w={6} h={6} style={{
                              borderRadius: '50%',
                              backgroundColor: '#fece02',
                              flexShrink: 0
                            }}/>}
                          </Group>
                        ),
                      },
                    ]}
                  />

                  <Button
                    size="sm"
                    variant="subtle"
                    rightSection={detailsOpen ? <IconChevronUp size={14}/> : <IconChevronDown size={14}/>}
                    onClick={() => setDetailsOpen(o => !o)}
                  >
                    Details
                  </Button>
                </Group>

                <Group gap="xs">
                  <Button
                    size="sm"
                    variant="outline"
                    color="gray"
                    leftSection={<IconRotate size={16}/>}
                    disabled={!activeCategory || !dirtyCategories.has(activeCategory) || saving}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>

                  <Button
                    size="sm"
                    disabled={!activeCategory || !dirtyCategories.has(activeCategory)}
                    loading={saving}
                    onClick={() => handleSaveResults()}
                  >
                    Save Changes
                  </Button>
                </Group>
              </Group>
            )}

            {!!currentCategory && (
              <Collapse in={detailsOpen}>
                <Paper withBorder bg="var(--mantine-color-gray-0)" p="md" mb="md" mt="xs">
                  <CategoryDetailPanel
                    key={`${currentCategory.alias}-${detailPanelResetKey}`}
                    category={currentCategory}
                    year={year}
                    eventHash={eventHash}
                    event={event}
                    onCategoryChange={handleCategoryChange}
                  />
                </Paper>
              </Collapse>
            )}

            {/* Always mounted to preserve form dirty state; hidden when on primes tab */}
            <div style={{ display: activeTab === 'results' ? 'block' : 'none' }}>
              <ResultsTable
                category={currentCategory}
                sourceUrls={event.sourceUrls}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn}
                onAddCategory={handleOpenEditCategoryModal}
                onUploadFile={handleOpenFileUpload}
              />
            </div>

            {activeTab === 'primes' && currentCategory && (
              <PrimesTable key={`${currentCategory.alias}-${detailPanelResetKey}`}/>
            )}
          </Box>
        </Flex>
      </Box>
    </ResultsFormContext.Provider>
  )
}
