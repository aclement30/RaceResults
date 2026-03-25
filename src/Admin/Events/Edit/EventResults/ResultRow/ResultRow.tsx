import { ActionIcon, Group, NumberInput, Select, Stack, Table, Text, TextInput, Tooltip } from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowBackUp,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
  IconUserCheck
} from '@tabler/icons-react'
import React, { useContext, useEffect, useState } from 'react'
import type { TParticipantStatus } from '../../../../../../shared/schemas/events'
import { AdminContext } from '../../../../Shared/AdminContext'
import { AthleteAutocomplete } from '../../../../Shared/AthleteAutocomplete/AthleteAutocomplete'
import { TeamAutocomplete } from '../../../../Shared/TeamAutocomplete/TeamAutocomplete'
import { useFormChanges } from '../../../../utils/useFormChanges'
import { ResultsFormContext } from '../ResultsFormContext'
import { formatTime, parseTime, participantName } from '../utils'

type ResultRowProps = {
  participantId: string
  index: number
  isLast?: boolean
  hasErrors: boolean
  visibleColumns: Set<string>
  onDelete: (participantId: string) => void
  onMove: (participantId: string, direction: 'up' | 'down') => void
}

const CURRENT_YEAR = new Date().getFullYear()

const STATUS_OPTIONS = [
  { value: 'FINISHER', label: 'Finisher' },
  { value: 'DNF', label: 'DNF' },
  { value: 'DNS', label: 'DNS' },
  { value: 'OTL', label: 'OTL' },
  { value: 'DQ', label: 'DQ' },
  { value: 'NP', label: 'NP' },
  { value: 'TC', label: 'TC' },
]

const ErrorTooltip: React.FC<{ error: React.ReactNode }> = ({ error }) => {
  if (!error) return null
  return (
    <Tooltip label={error} withArrow>
      <IconAlertCircle size={14} color="var(--mantine-color-red-6)" style={{ cursor: 'default' }}/>
    </Tooltip>
  )
}

export const ResultRow = React.memo<ResultRowProps>(({
  participantId,
  index,
  isLast,
  visibleColumns,
  onDelete,
  onMove,
}) => {
  const formRef = useContext(ResultsFormContext)!
  const form = formRef.current
  const { findAthlete } = useContext(AdminContext)
  const { getFieldStyles, onFormValuesChange } = useFormChanges(form.getInitialValues().results[index])

  const onValueChange = () => {
    onFormValuesChange(form.getValues().results[index])
  }

  // Locally controlled values for fields that require special handling (athlete name, team name, status)
  const initialResult = form.getValues().results[index]
  const [athleteName, setAthleteName] = useState(() => initialResult ? participantName(initialResult) : '')
  const [uciId, setUciId] = useState(() => initialResult?.uciId || '')
  const [teamName, setTeamName] = useState(() => initialResult?.team || '')
  const [status, setStatus] = useState<string | null>(() => initialResult?.status ?? 'FINISHER')
  const [isAthleteMatched, setIsAthleteMatched] = useState(
    () => !!initialResult?.uciId && !!findAthlete({ uciId: initialResult.uciId })
  )

  // Reset locally controlled values when participantId changes
  useEffect(() => {
    const participant = form.getValues().results[index]
    setAthleteName(participant ? participantName(participant) : '')
    setUciId(participant?.uciId || '')
    setTeamName(participant?.team || '')
    setStatus(participant?.status ?? 'FINISHER')
    setIsAthleteMatched(!!participant?.uciId && !!findAthlete({ uciId: participant.uciId }))
  }, [participantId])

  const handleAthleteChange = ({ name, uciId }: { name?: string; uciId?: string }) => {
    let matchingAthlete

    if (uciId) {
      matchingAthlete = findAthlete({ uciId })
    } else if (name && /\(.+\)$/.test(name.trim())) {
      // Ignore FIRSTNAME LASTNAME (UCIID) that is passed as a duplicate onChange() from AthleteAutocomplete when selecting an option
      return
    }

    if (matchingAthlete) {
      form.setFieldValue(`results.${index}.firstName`, matchingAthlete.firstName)
      form.setFieldValue(`results.${index}.lastName`, matchingAthlete.lastName)
      form.setFieldValue(`results.${index}.uciId`, matchingAthlete.uciId)
      form.setFieldValue(`results.${index}.city`, matchingAthlete.city || undefined)
      form.setFieldValue(`results.${index}.province`, matchingAthlete.province || undefined)
      form.setFieldValue(`results.${index}.license`, matchingAthlete.licenses[CURRENT_YEAR]?.[0] || undefined)
      form.setFieldValue(`results.${index}.age`, matchingAthlete.birthYear ? CURRENT_YEAR - matchingAthlete.birthYear : undefined)
      form.setFieldValue(`results.${index}.nationality`, matchingAthlete.nationality || undefined)

      setAthleteName(`${matchingAthlete.firstName} ${matchingAthlete.lastName}`)
      setUciId(matchingAthlete.uciId)
      setIsAthleteMatched(true)

      // If team name is not already set, try to fill it from athlete's current team
      if (!teamName?.length && matchingAthlete.teams[CURRENT_YEAR]) {
        form.setFieldValue(`results.${index}.team`, matchingAthlete.teams[CURRENT_YEAR].name)
        setTeamName(matchingAthlete.teams[CURRENT_YEAR].name!)
        onValueChange()
      }

      onValueChange()
    } else if (name) {
      const parts = name.trim().split(/\s+/) || []
      form.setFieldValue(`results.${index}.firstName`, parts[0] || '')
      form.setFieldValue(`results.${index}.lastName`, parts.slice(1).join(' ') || undefined)
      setAthleteName(name)
      setIsAthleteMatched(false)
    }

    onValueChange()
  }

  const handleTeamChange = (value: string) => {
    setTeamName(value)
    form.setFieldValue(`results.${index}.team`, value)
    onValueChange()
  }

  const handleStatusChange = (s: string | null) => {
    setStatus(s)
    form.setFieldValue(`results.${index}.status`, s as TParticipantStatus)
    form.validateField(`results.${index}.status`)
    onValueChange()
  }

  const handleRevert = () => {
    const initialRow = form.getInitialValues().results[index]
    if (!initialRow) return

    const next = [...form.getValues().results]
    next[index] = initialRow
    form.setValues({ results: next })

    setAthleteName(participantName(initialRow))
    setUciId(initialRow.uciId || '')
    setTeamName(initialRow.team || '')
    setStatus(initialRow.status ?? 'FINISHER')
    setIsAthleteMatched(!!initialRow.uciId && !!findAthlete({ uciId: initialRow.uciId }))

    form.setFieldError(`results.${index}.bibNumber`, null)
    form.setFieldError(`results.${index}.uciId`, null)
    form.setFieldError(`results.${index}.firstName`, null)
    form.setFieldError(`results.${index}.avgSpeed`, null)
    form.setFieldError(`results.${index}.status`, null)

    onFormValuesChange(form.getValues().results[index])
  }

  const canRevert = !!form.getInitialValues().results[index]

  return (
    <Table.Tr>
      <Table.Td w={60}>
        <Group gap={4} wrap="nowrap">
          <Text size="sm" w={20} ta="center">{index + 1}</Text>
          <Stack gap={2}>
            <ActionIcon
              size="xs"
              variant="subtle"
              disabled={index === 0}
              onClick={() => onMove(participantId, 'up')}
            >
              <IconChevronUp size={12}/>
            </ActionIcon>

            <ActionIcon
              size="xs"
              variant="subtle"
              disabled={isLast}
              onClick={() => onMove(participantId, 'down')}
            >
              <IconChevronDown size={12}/>
            </ActionIcon>
          </Stack>
        </Group>
      </Table.Td>

      {visibleColumns.has('bib') && (
        <Table.Td w={60}>
          <NumberInput
            size="xs"
            hideControls
            styles={getFieldStyles('bibNumber', !!form.errors[`results.${index}.bibNumber`])}
            {...form.getInputProps(`results.${index}.bibNumber`)}
            error={undefined}
            rightSection={form.errors[`results.${index}.bibNumber`]
              ? <ErrorTooltip error={form.errors[`results.${index}.bibNumber`]}/>
              : undefined}
            onBlur={() => {
              form.validateField(`results.${index}.bibNumber`)
              onValueChange()
            }}
          />
        </Table.Td>
      )}

      <Table.Td style={{ minWidth: 240 }}>
        <AthleteAutocomplete
          size="xs"
          value={athleteName}
          onChange={value => handleAthleteChange({ name: value })}
          onOptionSubmit={value => handleAthleteChange({ uciId: value })}
          onBlur={() => form.validateField(`results.${index}.firstName`)}
          styles={getFieldStyles(['firstName', 'lastName'], !!form.errors[`results.${index}.firstName`])}
          rightSection={form.errors[`results.${index}.firstName`]
            ? <ErrorTooltip error={form.errors[`results.${index}.firstName`]}/>
            : isAthleteMatched
              ? <IconUserCheck size={14} color="var(--mantine-color-green-6)"/>
              : undefined}
        />
      </Table.Td>

      {visibleColumns.has('uciId') && (
        <Table.Td w={130}>
          <TextInput
            size="xs"
            maxLength={11}
            styles={getFieldStyles('uciId', !!form.errors[`results.${index}.uciId`])}
            value={uciId}
            rightSection={form.errors[`results.${index}.uciId`]
              ? <ErrorTooltip error={form.errors[`results.${index}.uciId`]}/>
              : undefined}
            onChange={e => {
              setUciId(e.target.value)
              form.setFieldValue(`results.${index}.uciId`, e.target.value)
            }}
            onBlur={() => {
              form.validateField(`results.${index}.uciId`)
              onValueChange()
            }}
          />
        </Table.Td>
      )}

      {visibleColumns.has('team') && (
        <Table.Td style={{ minWidth: 150 }}>
          <TeamAutocomplete
            size="xs"
            placeholder="Team"
            styles={getFieldStyles('team')}
            valueAttribute="name"
            value={teamName}
            onChange={handleTeamChange}
          />
        </Table.Td>
      )}

      {visibleColumns.has('city') && (
        <Table.Td w={110}>
          <TextInput
            size="xs"
            disabled
            value={form.getValues().results[index].city}
          />
        </Table.Td>
      )}

      {visibleColumns.has('province') && (
        <Table.Td w={70}>
          <TextInput
            size="xs"
            disabled
            value={form.getValues().results[index].province}
          />
        </Table.Td>
      )}

      {visibleColumns.has('license') && (
        <Table.Td w={100}>
          <TextInput
            size="xs"
            disabled
            value={form.getValues().results[index].license}
          />
        </Table.Td>
      )}

      {visibleColumns.has('age') && (
        <Table.Td w={70}>
          <NumberInput
            size="xs"
            hideControls
            disabled
            value={form.getValues().results[index].age}
          />
        </Table.Td>
      )}

      {visibleColumns.has('nationality') && (
        <Table.Td w={90}>
          <TextInput
            size="xs"
            disabled
            value={form.getValues().results[index].nationality}
          />
        </Table.Td>
      )}

      {/* Time fields: stored as seconds, displayed as h:mm:ss — handled manually */}
      {visibleColumns.has('finishTime') && (
        <Table.Td w={100}>
          <TextInput
            size="xs"
            key={form.key(`results.${index}.finishTime`)}
            defaultValue={form.getValues().results[index]?.finishTime
              ? formatTime(form.getValues().results[index].finishTime as number)
              : ''}
            placeholder="h:mm:ss"
            disabled={status === 'DNS'}
            styles={getFieldStyles('finishTime')}
            onBlur={e => {
              const parsed = parseTime(e.target.value) || null
              const current = form.getValues().results[index].finishTime ?? null
              if (parsed === current) return
              form.setFieldValue(`results.${index}.finishTime`, parsed)
              onValueChange()
            }}
          />
        </Table.Td>
      )}

      {visibleColumns.has('finishGap') && (
        <Table.Td w={100}>
          <TextInput
            size="xs"
            key={form.key(`results.${index}.finishGap`)}
            defaultValue={form.getValues().results[index]?.finishGap
              ? formatTime(form.getValues().results[index].finishGap as number)
              : ''}
            placeholder="+h:mm:ss"
            disabled={status === 'DNS'}
            styles={getFieldStyles('finishGap')}
            onBlur={e => {
              const parsed = parseTime(e.target.value) || undefined
              const current = form.getValues().results[index].finishGap
              if (parsed === current) return
              form.setFieldValue(`results.${index}.finishGap`, parsed)
              onValueChange()
            }}
          />
        </Table.Td>
      )}

      {visibleColumns.has('avgSpeed') && (
        <Table.Td w={90}>
          <NumberInput
            size="xs"
            hideControls
            decimalScale={1}
            placeholder="km/h"
            disabled={status === 'DNS'}
            styles={getFieldStyles('avgSpeed', !!form.errors[`results.${index}.avgSpeed`])}
            {...form.getInputProps(`results.${index}.avgSpeed`)}
            error={undefined}
            rightSection={form.errors[`results.${index}.avgSpeed`]
              ? <ErrorTooltip error={form.errors[`results.${index}.avgSpeed`]}/>
              : undefined}
            onChange={val => form.setFieldValue(
              `results.${index}.avgSpeed`,
              typeof val === 'number' && val > 0 ? val : undefined
            )}
            onBlur={() => {
              form.validateField(`results.${index}.avgSpeed`)
              onValueChange()
            }}
          />
        </Table.Td>
      )}

      {visibleColumns.has('status') && (
        <Table.Td w={100}>
          <Select
            size="xs"
            value={status}
            allowDeselect={false}
            data={STATUS_OPTIONS}
            styles={getFieldStyles('status', !!form.errors[`results.${index}.status`])}
            rightSection={form.errors[`results.${index}.status`]
              ? <ErrorTooltip error={form.errors[`results.${index}.status`]}/>
              : undefined}
            onChange={handleStatusChange}
          />
        </Table.Td>
      )}

      <Table.Td w={50}>
        <Group gap={2} wrap="nowrap" justify="flex-end">
          <Tooltip label="Revert changes" withArrow disabled={!canRevert}>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              disabled={!canRevert}
              onClick={handleRevert}
            >
              <IconArrowBackUp size={16}/>
            </ActionIcon>
          </Tooltip>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => onDelete(participantId)}
          >
            <IconTrash size={16}/>
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
})
