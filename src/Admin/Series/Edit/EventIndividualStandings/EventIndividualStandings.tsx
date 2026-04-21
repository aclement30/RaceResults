import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Collapse,
  Divider,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Select,
  Text,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import {
  IconChartBarPopular,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconEyeOff,
  IconListNumbers,
  IconPlus,
  IconRotate,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import type {
  BaseCategory,
  EventResults,
  ParticipantResult,
  ParticipantSerieEventResult,
  PrimeResult,
  SerieIndividualEvent,
  SerieIndividualEventCategory,
  SerieStandings,
} from '../../../../../shared/types'
import { Loader } from '../../../../Loader/Loader'
import { EmptyState } from '../../../../Shared/EmptyState'
import { showErrorMessage } from '../../../../utils/showErrorMessage'
import { openEditCategoryModal } from '../../../Events/Edit/EventResults/EditCategoryModal/EditCategoryModal'
import { AdminContext } from '../../../Shared/AdminContext'
import { CategorySidebar } from '../../../Shared/CategorySidebar/CategorySidebar'
import { PublishedBadge } from '../../../Shared/PublishedBadge/PublishedBadge'
import { adminApi } from '../../../utils/api'
import type { AdminSerieEditOutletContext } from '../Edit'
import type { ScaleApplyMode, ScaleBaseColumn } from '../SerieEventResultsTable/PointScaleModal/PointScaleModal'
import { openPointScaleModal } from '../SerieEventResultsTable/PointScaleModal/PointScaleModal'
import { SerieEventStandingsTable } from '../SerieEventResultsTable/SerieEventStandingsTable'
import { TabBar } from '../TabBar/TabBar'
import { CategoryDetailPanel } from './CategoryDetailPanel/CategoryDetailPanel'
import { openDeleteSerieEventModal } from './DeleteSerieEventModal/DeleteSerieEventModal'
import { openSerieFileUploadModal } from './FileUploadModal/FileUploadModal'
import { SerieEventFormContext, type SerieEventFormValues } from './SerieEventFormContext'
import { applySortToResults } from './utils'

export type SortColumn = 'points' | 'finishPosition' | 'prime'

export const SerieEventIndividualStandings: React.FC = () => {
  const { serie, raceEvents } = useOutletContext<AdminSerieEditOutletContext>()
  const params = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { findAthlete } = useContext(AdminContext)

  const [serieStandings, setSerieStandings] = useState<SerieStandings>()
  const [raceEventResults, setRaceEventResults] = useState<EventResults>()
  const [fileImportedResults, setFileImportedResults] = useState<ParticipantResult[]>([])
  const [fileImportedPrimes, setFileImportedPrimes] = useState<PrimeResult[]>([])
  const [loading, setLoading] = useState(true)

  const categories = serieStandings?.categories ?? []
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dirtyCategories, setDirtyCategories] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('points')
  const [tableKey, setTableKey] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!serie) return

      try {
        setLoading(true)

        const matchingRaceEvent = params.date && raceEvents.find((e) => e.serie === serie.alias && e.date === params.date)

        const [
          serieStandings,
          raceEventResults,
        ] = await Promise.all([
          adminApi.get.serieStandings(serie.year, serie.hash),
          matchingRaceEvent ? adminApi.get.eventResults(serie.year, matchingRaceEvent.hash) : Promise.resolve(undefined),
        ])

        setSerieStandings(serieStandings)
        setActiveCategory(serieStandings?.categories[0]?.alias ?? null)
        setRaceEventResults(raceEventResults)
      } catch (err) {
        showErrorMessage({ title: 'Error', message: (err as Error).message })

        setSerieStandings({ hash: serie.hash, categories: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.date, serie, raceEvents])

  const currentSerieEvent = useMemo(() => {
    if (!activeCategory || !serieStandings?.individual?.events.length) return undefined

    return serieStandings.individual.events.find(e => e.date === params.date)
  }, [params.date, activeCategory, serieStandings?.individual?.events])

  const currentRaceEventCategoryResults = useMemo(() => {
    if (!activeCategory || !raceEventResults) return []

    return raceEventResults.categories.find(c => c.alias === activeCategory)?.results ?? []
  }, [activeCategory, raceEventResults])

  const currentRaceEventCategoryPrimes = useMemo(() => {
    if (!activeCategory || !raceEventResults) return []

    return raceEventResults.categories.find(c => c.alias === activeCategory)?.primes ?? []
  }, [activeCategory, raceEventResults])

  const effectiveRaceEventResults = useMemo(
    () => currentRaceEventCategoryResults.length > 0 ? currentRaceEventCategoryResults : fileImportedResults,
    [currentRaceEventCategoryResults, fileImportedResults],
  )

  const effectiveRaceEventPrimes = useMemo(
    () => currentRaceEventCategoryPrimes.length > 0 ? currentRaceEventCategoryPrimes : fileImportedPrimes,
    [currentRaceEventCategoryPrimes, fileImportedPrimes],
  )

  useEffect(() => {
    setFileImportedResults([])
    setFileImportedPrimes([])
  }, [activeCategory, params.date])

  const form = useForm<SerieEventFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      standings: (currentSerieEvent?.categories[activeCategory!]?.standings ?? []) as ParticipantSerieEventResult[],
      corrections: currentSerieEvent?.categories[activeCategory!]?.corrections,
    },
    onValuesChange: () => {
      handleDirtyChangeRef.current(form.isDirty())
    },
    validate: (values) => {
      const errors: Record<string, string> = {}

      const seenNames = new Map<string, number>()
      const seenBibs = new Map<number, number>()
      const seenUciIds = new Map<string, number>()

      values.standings.forEach((result, index) => {
        if (!result.firstName?.trim() && result.bibNumber === null) errors[`standings.${index}.firstName`] = 'Either name or bib number is required'
        if (result.bibNumber && (result.bibNumber as number) <= 0) errors[`standings.${index}.bibNumber`] = 'Bib must be a number'
        if (result.uciId && result.uciId.length !== 11) errors[`standings.${index}.uciId`] = 'UCI ID must be 11 numeric characters'
        if (result.points == null) errors[`standings.${index}.points`] = 'Points is required'

        const fullName = [result.firstName?.trim(), result.lastName?.trim()].filter(Boolean).join(' ')
        if (fullName) {
          const key = fullName.toLowerCase()
          if (seenNames.has(key)) {
            errors[`standings.${index}.firstName`] = 'Duplicate name'
            errors[`standings.${seenNames.get(key)!}.firstName`] = 'Duplicate name'
          } else {
            seenNames.set(key, index)
          }
        }

        if (result.bibNumber != null) {
          if (seenBibs.has(result.bibNumber)) {
            errors[`standings.${index}.bibNumber`] = 'Duplicate bib number'
            errors[`standings.${seenBibs.get(result.bibNumber)!}.bibNumber`] = 'Duplicate bib number'
          } else {
            seenBibs.set(result.bibNumber, index)
          }
        }

        if (result.uciId?.trim()) {
          if (seenUciIds.has(result.uciId)) {
            errors[`standings.${index}.uciId`] = 'Duplicate UCI ID'
            errors[`standings.${seenUciIds.get(result.uciId)!}.uciId`] = 'Duplicate UCI ID'
          } else {
            seenUciIds.set(result.uciId, index)
          }
        }
      })

      return errors
    },
  })

  const formRef = useRef(form)
  formRef.current = form

  const handleDirtyChangeRef = useRef<(isDirty: boolean) => void>(() => {})
  handleDirtyChangeRef.current = (isDirty: boolean) => {
    if (!activeCategory) return
    setDirtyCategories(prev => {
      if (isDirty === prev.has(activeCategory)) return prev
      const next = new Set(prev)
      if (isDirty) next.add(activeCategory)
      else next.delete(activeCategory)
      return next
    })
  }

  useEffect(() => {
    if (!currentSerieEvent || !activeCategory) return

    const existingStandings = (currentSerieEvent.categories[activeCategory]?.standings || []) as ParticipantSerieEventResult[]

    const defaultSortColumn: SortColumn = existingStandings.length > 0
      ? 'points'
      : effectiveRaceEventResults.length > 0 ? 'finishPosition' : 'points'

    setSortColumn(defaultSortColumn)

    const sortedStandings = applySortToResults(
      existingStandings, //.filter(result => result.points > 0),
      defaultSortColumn,
      effectiveRaceEventResults,
      effectiveRaceEventPrimes,
    )

    const newValues = {
      standings: sortedStandings,
      corrections: currentSerieEvent.categories[activeCategory]?.corrections
    }

    formRef.current.resetDirty(newValues)
    formRef.current.setValues(newValues)
    setTableKey(k => k + 1)
    setDetailsOpen(false)
  }, [activeCategory, serieStandings])

  const confirmIfDirty = (onConfirm: () => void) => {
    if (activeCategory && dirtyCategories.has(activeCategory)) {
      const label = categories.find(c => c.alias === activeCategory)?.label
      modals.openConfirmModal({
        title: 'Unsaved changes',
        children: <Text size="sm"><strong>{label}</strong> has unsaved changes. Switch anyway and discard them?</Text>,
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

  const handleSwitchEvent = (date: string) => {
    if (date === params.date) return

    const doNavigate = () => navigate(`/admin/series/${serie!.year}/${serie!.hash}/standings/individual/${date}`)

    if (dirtyCategories.size > 0) {
      modals.openConfirmModal({
        title: 'Unsaved changes',
        children: <Text size="sm">You have unsaved changes. Switch to another event and discard them?</Text>,
        labels: { confirm: 'Switch anyway', cancel: 'Stay' },
        confirmProps: { color: 'red' },
        onConfirm: () => {
          setDirtyCategories(new Set())
          doNavigate()
        },
      })
    } else {
      doNavigate()
    }
  }

  const handleSortChange = (column: SortColumn) => {
    setSortColumn(column)
    const sorted = applySortToResults(
      formRef.current.getValues().standings,
      column,
      effectiveRaceEventResults,
      effectiveRaceEventPrimes,
    )
    formRef.current.setValues({ standings: sorted })
  }

  const handlePointChange = () => {
    if (sortColumn !== 'points') return

    const sorted = applySortToResults(
      formRef.current.getValues().standings,
      'points',
      effectiveRaceEventResults,
      effectiveRaceEventPrimes,
    )

    formRef.current.setValues({ standings: sorted })
  }

  const handleApplyScale = () => {
    openPointScaleModal({
      currentResults: formRef.current.getValues().standings,
      raceEventResults: effectiveRaceEventResults,
      raceEventPrimes: effectiveRaceEventPrimes,
      onApply: (scalePoints: number[], baseColumn: ScaleBaseColumn, applyMode: ScaleApplyMode) => {
        const currentResults = formRef.current.getValues().standings

        const updatedResults = currentResults.map(result => {
          let racePosition: number | null = null

          const raceResult = result.uciId
            ? effectiveRaceEventResults.find(r => r.uciId === result.uciId)
            : effectiveRaceEventResults.find(r => r.firstName === result.firstName && r.lastName === result.lastName)

          if (baseColumn === 'finishPosition') {
            racePosition = raceResult?.position ?? null
          } else {
            if (raceResult) {
              const prime = effectiveRaceEventPrimes.find(p => p.participantId === raceResult.participantId)
              racePosition = prime?.position ?? null
            }
          }

          if (racePosition === null || racePosition > scalePoints.length) {
            return applyMode === 'overwrite' ? { ...result, points: 0 } : result
          }

          const scaleValue = scalePoints[racePosition - 1]
          return {
            ...result,
            points: applyMode === 'overwrite' ? scaleValue : result.points + scaleValue,
          }
        })

        const sorted = applySortToResults(
          updatedResults,
          sortColumn,
          effectiveRaceEventResults,
          effectiveRaceEventPrimes,
        )
        formRef.current.setValues({ standings: sorted })
        setTableKey(k => k + 1)
        // Always create a new Set to force a re-render, and mark category as dirty
        if (activeCategory) {
          setDirtyCategories(prev => new Set([...prev, activeCategory]))
        }
      },
    })
  }

  const handleReset = () => {
    modals.openConfirmModal({
      title: 'Reset changes',
      children: <Text size="sm">Discard all changes
        to <strong>{categories.find(c => c.alias === activeCategory)?.label}</strong>?</Text>,
      labels: { confirm: 'Reset', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        const savedStandings = (currentSerieEvent?.categories[activeCategory!]?.standings ?? []) as ParticipantSerieEventResult[]
        const sorted = applySortToResults(
          savedStandings,
          sortColumn,
          effectiveRaceEventResults,
          effectiveRaceEventPrimes,
        )
        const resetValues: SerieEventFormValues = {
          standings: sorted,
          corrections: currentSerieEvent?.categories[activeCategory!]?.corrections,
        }
        formRef.current.resetDirty(resetValues)
        formRef.current.setValues(resetValues)
        handleDirtyChangeRef.current(false)
        setTableKey(k => k + 1)
      },
    })
  }

  const handleLockChange = async (locked: boolean): Promise<boolean> => {
    if (!serie || !activeCategory || !currentSerieEvent) return false

    try {
      await adminApi.update.serieStandingEventCategoryLock(locked, {
        year: serie.year, serieHash: serie.hash, date: params.date!, categoryAlias: activeCategory,
      })
      const existingEvents = serieStandings!.individual?.events ?? []
      const existingEvent = existingEvents.find(e => e.date === params.date!)
      const updatedEvent: SerieIndividualEvent = {
        date: params.date!,
        published: existingEvent?.published ?? false,
        categories: {
          ...(existingEvent?.categories ?? {}),
          [activeCategory]: { ...currentSerieEvent.categories[activeCategory], userLocked: locked },
        },
      }

      setSerieStandings(current => !current ? current : ({
        ...current,
        individual: current.individual
          ? {
            ...current.individual,
            events: existingEvents.map(e => e.date === params.date ? updatedEvent : e)
          }
          : undefined,
      }))

      return true
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as Error).message })
      return false
    }
  }

  const doPublishedChange = async (published: boolean) => {
    if (!serie || !currentSerieEvent) return

    try {
      await adminApi.update.serieStandingEventPublished(published, {
        year: serie.year,
        serieHash: serie.hash,
        date: params.date!,
      })

      const existingEvents = serieStandings!.individual?.events ?? []
      const updatedEvent: SerieIndividualEvent = { ...currentSerieEvent, published }

      setSerieStandings(current => !current ? current : ({
        ...current,
        individual: current.individual
          ? { ...current.individual, events: existingEvents.map(e => e.date === params.date ? updatedEvent : e) }
          : undefined,
      }))
    } catch (error) {
      showErrorMessage({ title: 'Error', message: (error as Error).message })
    }
  }

  const handlePublishedChange = (published: boolean) => {
    if (!published) {
      doPublishedChange(false)
      return
    }

    const emptyCategoryLabels = categories
    .filter(cat => !currentSerieEvent?.categories[cat.alias]?.standings?.length)
    .map(cat => cat.label)

    if (emptyCategoryLabels.length === 0) {
      doPublishedChange(true)
      return
    }

    modals.openConfirmModal({
      title: 'Publish this event',
      children: (
        <Text size="sm">
          {emptyCategoryLabels.length === 1
            ? <><strong>{emptyCategoryLabels[0]}</strong> has no standings.</>
            : <>{emptyCategoryLabels.map((label, index) => (
              <span key={label}>
                {index > 0 && ', '}
                <strong>{label}</strong>
              </span>
            ))} have no standings.</>
          }
          {' '}Do you want to publish this event anyway?
        </Text>
      ),
      labels: { confirm: 'Publish anyway', cancel: 'Cancel' },
      onConfirm: () => doPublishedChange(true),
    })
  }

  const updateLocalCategories = (updatedCategories: BaseCategory[]) => {
    setSerieStandings(current => !current ? current : ({
      ...current,
      categories: updatedCategories,
    }))
  }

  const saveCategories = async (updated: BaseCategory[]) => {
    await adminApi.update.serieStandingCategories(serie!.year, serie!.hash, updated)
  }

  const handleOpenEditCategoryModal = (originalAlias?: string) => {
    const existing = originalAlias ? categories.find(c => c.alias === originalAlias) ?? null : null

    openEditCategoryModal({
      category: existing,
      existingCategories: categories,
      onSubmit: async (updated) => {
        const updatedCategories = existing
          ? categories.map(c => c.alias === originalAlias ? updated : c)
          : [...categories, updated]

        try {
          await saveCategories(updatedCategories)
        } catch (err) {
          showErrorMessage({ title: 'Error', message: (err as Error).message })
          throw err
        }

        updateLocalCategories(updatedCategories)
        if (!existing || activeCategory === originalAlias) setActiveCategory(updated.alias)
      },
    })
  }

  const handleDeleteCategory = (alias: string) => {
    const cat = categories.find(c => c.alias === alias)
    if (!cat) return

    const modalId = modals.openConfirmModal({
      title: 'Delete category',
      children: (
        <Text size="sm">
          Delete <strong>{cat.label}</strong>? This will remove the category from all standings events in this series.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      closeOnConfirm: false,
      onConfirm: async () => {
        modals.updateModal({ modalId, confirmProps: { color: 'red', loading: true }, cancelProps: { disabled: true } })
        try {
          const updatedCategories = categories.filter(c => c.alias !== alias)
          await saveCategories(updatedCategories)
          updateLocalCategories(updatedCategories)
          if (activeCategory === alias) setActiveCategory(updatedCategories[0]?.alias ?? null)
          setDirtyCategories(prev => {
            const next = new Set(prev)
            next.delete(alias)
            return next
          })
        } catch (err) {
          showErrorMessage({ title: 'Error', message: (err as Error).message })
        }
        modals.close(modalId)
      },
    })
  }

  const handleReorderCategories = async (reordered: BaseCategory[]) => {
    updateLocalCategories(reordered)

    try {
      await saveCategories(reordered)
    } catch (err) {
      showErrorMessage({ title: 'Error', message: (err as Error).message })
    }
  }

  const handleOpenFileUpload = () => {
    const activeCategoryLabel = categories.find(c => c.alias === activeCategory)?.label ?? ''
    const hasExistingResults = !!(activeCategory && currentSerieEvent?.categories[activeCategory]?.standings?.length)

    openSerieFileUploadModal({
      activeCategoryLabel,
      hasExistingResults,
      onImport: handleFileImport,
    })
  }

  const handleFileImport = (
    results: Array<ParticipantSerieEventResult & Partial<{ finishPosition: number, primes: number }>>,
  ) => {
    const shapedResults = results.map((r, index) => {
      const matchingAthlete = findAthlete({ uciId: r.uciId, firstName: r.firstName, lastName: r.lastName })
      return {
        ...r,
        participantId: `p-${Date.now()}-${index}`,
        firstName: matchingAthlete ? matchingAthlete.firstName : r.firstName,
        lastName: matchingAthlete ? matchingAthlete.lastName : r.lastName,
        uciId: matchingAthlete ? matchingAthlete.uciId : r.uciId,
        team: matchingAthlete ? matchingAthlete.teams[serie!.year]?.name : r.team,
      }
    })

    const hasFinishPositions = shapedResults.some(r => r.finishPosition != null)
    const hasPrimes = shapedResults.some(r => r.primes != null)

    let synthesizedResults: ParticipantResult[] = []
    let synthesizedPrimes: PrimeResult[] = []

    if (hasFinishPositions || hasPrimes) {
      synthesizedResults = shapedResults.map(r => ({
        participantId: r.participantId,
        firstName: r.firstName,
        lastName: r.lastName,
        uciId: r.uciId,
        position: r.finishPosition ?? null,
        finishTime: null,
        status: null,
      }))

      synthesizedPrimes = shapedResults
      .map(r => r.primes != null ? ({
        participantId: r.participantId,
        number: 1,
        position: r.primes,
      }) : null)
      .filter((p): p is PrimeResult => p !== null)

      setFileImportedResults(synthesizedResults)
      setFileImportedPrimes(synthesizedPrimes)
    } else {
      setFileImportedResults([])
      setFileImportedPrimes([])
    }

    const sorted = applySortToResults(
      shapedResults,
      'points',
      synthesizedResults,
      synthesizedPrimes,
    )

    const newValues: SerieEventFormValues = { standings: sorted, corrections: undefined }
    formRef.current.resetDirty(newValues)
    formRef.current.setValues(newValues)
    setTableKey(k => k + 1)

    if (activeCategory) setDirtyCategories(prev => new Set([...prev, activeCategory]))
  }

  const handleDeleteEvent = () => {
    openDeleteSerieEventModal({
      year: serie!.year,
      serieHash: serie!.hash,
      date: params.date!,
      formattedDate: formattedDate!,
      onDeleted: () => navigate(`/admin/series/${serie!.year}/${serie!.hash}`),
    })
  }

  const handleSave = async () => {
    if (!serie || !activeCategory) return

    const { hasErrors } = formRef.current.validate()
    if (hasErrors) return

    try {
      setSaving(true)
      const { standings, corrections } = formRef.current.getValues()

      const shapedStandings = standings.map((r) => ({
        participantId: r.participantId,
        firstName: r.firstName,
        lastName: r.lastName,
        uciId: r.uciId,
        bibNumber: r.bibNumber && !isNaN(r.bibNumber) ? Number(r.bibNumber) : undefined,
        team: r.team,
        points: !isNaN(r.points) ? Number(r.points) : 0,
      })).filter(r => r.firstName.length && r.lastName.length)

      const eventCategory: SerieIndividualEventCategory = {
        standings: shapedStandings,
        corrections,
      }

      const updatedEventCategory = await adminApi.update.serieStandingEventCategory(eventCategory, {
        year: serie.year,
        serieHash: serie.hash,
        date: params.date!,
        categoryAlias: activeCategory
      })

      const newValues: SerieEventFormValues = {
        standings: (updatedEventCategory.standings ?? []) as ParticipantSerieEventResult[],
        corrections: updatedEventCategory.corrections,
      }

      formRef.current.resetDirty(newValues)
      formRef.current.setValues(newValues)

      setDirtyCategories(prev => {
        const next = new Set(prev)
        next.delete(activeCategory)
        return next
      })

      // Merge updated category into the existing event for this date
      const existingEvents = serieStandings!.individual?.events ?? []
      const existingEvent = existingEvents.find(e => e.date === params.date!)
      const updatedEvent: SerieIndividualEvent = {
        date: params.date!,
        published: existingEvent?.published ?? false,
        categories: {
          ...(existingEvent?.categories ?? {}),
          [activeCategory]: updatedEventCategory,
        },
      }

      const newEvents = existingEvent
        ? existingEvents.map(e => e.date === params.date! ? updatedEvent : e)
        : [...existingEvents, updatedEvent]

      setSerieStandings(current => !current ? current : ({
        ...current,
        individual: current.individual
          ? { ...current.individual, events: newEvents }
          : undefined,
      }))
    } catch (err) {
      showErrorMessage({ title: 'Save Error', message: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const isDirty = activeCategory ? dirtyCategories.has(activeCategory) : false

  const formattedDate = params.date
    ? new Date(`${params.date}T00:00:00`).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : params.date

  return (
    <SerieEventFormContext.Provider value={formRef}>
      <Breadcrumbs mb="md">
        <Anchor size="sm" onClick={() => navigate(`/admin/series?year=${serie!.year}`)}>Series</Anchor>
        <Anchor size="sm" onClick={() => navigate(`/admin/series/${serie!.year}/${serie!.hash}`)}>
          {serie!.name}
        </Anchor>
        <Text size="sm">{formattedDate}</Text>
      </Breadcrumbs>

      <Group justify="space-between" style={{ alignItems: 'center' }} pb="md">
        <div>
          <Group gap={5} style={{ alignItems: 'center' }}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>{formattedDate}</h2>
              <h3 style={{ marginTop: 0, marginBottom: 0 }}><Text c="grey">{serie!.name}</Text></h3>
            </div>
          </Group>
        </div>

        {currentSerieEvent && (
          <Group gap="md" align="center">
            <PublishedBadge published={currentSerieEvent.published || false}/>

            <Tooltip
              label="Save changes before publishing"
              disabled={dirtyCategories.size === 0}
            >
              <span>
                <Button
                  variant={currentSerieEvent.published ? 'outline' : 'primary'}
                  onClick={() => handlePublishedChange(!currentSerieEvent.published)}
                  leftSection={currentSerieEvent.published ? <IconEyeOff/> : <IconCircleCheck/>}
                  disabled={dirtyCategories.size > 0}
                >
                  {currentSerieEvent.published ? 'Unpublish' : 'Publish'}
                </Button>
              </span>
            </Tooltip>
          </Group>
        )}
      </Group>

      <TabBar year={serie!.year} serieHash={serie!.hash || ''} serie={serie}/>

      <Group mb="md" justify="space-between">
        <Group>
          {(serieStandings?.individual?.events?.length ?? 0) > 1 && (
            <Select
              size="sm"
              placeholder="Switch event"
              value={params.date ?? null}
              data={(serieStandings?.individual?.events ?? []).map(e => ({
                value: e.date!,
                label: new Date(`${e.date}T00:00:00`).toLocaleDateString('en-CA', {
                  year: 'numeric', month: 'long', day: 'numeric',
                }),
              }))}
              onChange={v => v && handleSwitchEvent(v)}
              allowDeselect={false}
              w={220}
            />
          )}

          <Button
            size="sm"
            variant="primary"
            leftSection={<IconUpload size={16}/>}
            onClick={handleOpenFileUpload}
            disabled={!categories.length}
          >
            Upload File
          </Button>
        </Group>

        <Button
          size="sm"
          variant="outline"
          color="red"
          leftSection={<IconTrash size={16}/>}
          disabled={!currentSerieEvent || currentSerieEvent.published}
          onClick={handleDeleteEvent}
        >
          Delete
        </Button>
      </Group>

      <Divider mb="md"/>

      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ children: <Loader text="Loading..."/> }}
      />

      <Box>
        <Flex gap="md" align="stretch">
          <CategorySidebar
            categories={categories}
            activeCategory={activeCategory}
            dirtyCategories={dirtyCategories}
            onSelectCategory={handleSelectCategory}
            onEditCategory={handleOpenEditCategoryModal}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
            onAddCategory={handleOpenEditCategoryModal}
          />

          <Divider orientation="vertical"/>

          <Box style={{ flex: 1 }}>
            {activeCategory && (
              <Group mb="md" justify="space-between">
                <Group gap="sm">
                  <Text size="lg" fw={500}>
                    {categories.find(c => c.alias === activeCategory)?.label}
                  </Text>
                  <Button
                    size="sm"
                    variant="subtle"
                    rightSection={detailsOpen ? <IconChevronUp size={14}/> : <IconChevronDown size={14}/>}
                    onClick={() => setDetailsOpen(open => !open)}
                  >
                    Details
                  </Button>
                </Group>

                <Group gap="xs">
                  {!!formRef.current.getValues().standings.length && (effectiveRaceEventResults.length || effectiveRaceEventPrimes.length) && (
                    <Button
                      size="sm"
                      variant="outline"
                      color="grape"
                      leftSection={<IconChartBarPopular size={16}/>}
                      onClick={handleApplyScale}
                    >
                      Apply Scale
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    color="gray"
                    leftSection={<IconRotate size={16}/>}
                    disabled={!isDirty || saving}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>

                  <Button
                    size="sm"
                    disabled={!isDirty}
                    loading={saving}
                    onClick={handleSave}
                  >
                    Save Changes
                  </Button>
                </Group>
              </Group>
            )}

            {!!currentSerieEvent && activeCategory && (
              <Collapse in={detailsOpen}>
                <Paper withBorder bg="var(--mantine-color-gray-0)" p="md" mb="md" mt="xs">
                  <CategoryDetailPanel
                    key={activeCategory}
                    eventCategory={currentSerieEvent.categories[activeCategory]}
                    source={serie!.source}
                    onLockChange={handleLockChange}
                  />
                </Paper>
              </Collapse>
            )}

            {!categories.length && (
              <EmptyState
                icon={<IconListNumbers size={28} color="var(--mantine-color-gray-5)"/>}
                text={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Text size="sm" fw={500} c="black">No categories yet</Text>
                  <Text size="sm" c="dimmed">Add a category to start entering standings.</Text>
                </div>}
                button={
                  <Button
                    size="sm"
                    leftSection={<IconPlus size={14}/>}
                    onClick={() => handleOpenEditCategoryModal()}
                  >
                    Add Category
                  </Button>
                }
              />
            )}

            {!!activeCategory && (
              <SerieEventStandingsTable
                key={tableKey}
                raceEventResults={effectiveRaceEventResults}
                raceEventPrimes={effectiveRaceEventPrimes}
                sortColumn={sortColumn}
                onSortChange={handleSortChange}
                onPointChange={handlePointChange}
                onOpenFileUpload={handleOpenFileUpload}
              />
            )}
          </Box>
        </Flex>
      </Box>
    </SerieEventFormContext.Provider>
  )
}
