import { ActionIcon, Group, NumberInput, Table, Text, Tooltip } from '@mantine/core'
import { IconArrowBackUp, IconTrash, } from '@tabler/icons-react'
import React, { useContext, useEffect, useState } from 'react'
import type { ParticipantResult, PrimeResult } from '../../../../../../shared/types'
import { AdminContext } from '../../../../Shared/AdminContext'
import { AthleteAutocomplete } from '../../../../Shared/AthleteAutocomplete/AthleteAutocomplete'
import { InputErrorIcon } from '../../../../Shared/InputErrorIcon/InputErrorIcon'
import { TeamAutocomplete } from '../../../../Shared/TeamAutocomplete/TeamAutocomplete'
import { useFormChanges } from '../../../../utils/useFormChanges'
import { SerieEventFormContext } from '../../EventIndividualStandings/SerieEventFormContext'

const CURRENT_YEAR = new Date().getFullYear()

type EventStandingRowProps = {
  participantId: string
  index: number
  isLast?: boolean
  raceEventResults: ParticipantResult[]
  raceEventPrimes: PrimeResult[]
  onDelete: (participantId: string) => void
  onPointChange: () => void
}


export const EventStandingRow: React.FC<EventStandingRowProps> = ({
  participantId,
  index,
  isLast,
  raceEventResults,
  raceEventPrimes,
  onDelete,
  onPointChange,
}) => {
  const formRef = useContext(SerieEventFormContext)!
  const form = formRef.current
  const { findAthlete } = useContext(AdminContext)
  const { getFieldStyles, onFormValuesChange } = useFormChanges(form.getInitialValues().standings[index] ?? {})

  const onValueChange = () => onFormValuesChange(form.getValues().standings[index])

  // Locally controlled values for fields that require special handling (athlete name, team name)
  const initialResult = form.getValues().standings[index]
  const [athleteName, setAthleteName] = useState(() =>
    initialResult ? [initialResult.firstName, initialResult.lastName].filter(Boolean).join(' ') : ''
  )
  const [uciId, setUciId] = useState(() => initialResult?.uciId || '')
  const [teamName, setTeamName] = useState(() => initialResult?.team || '')

  // Reset locally controlled values when participantId changes
  useEffect(() => {
    const participant = form.getValues().standings[index]

    setAthleteName(participant ? [participant.firstName, participant.lastName].filter(Boolean).join(' ') : '')
    setUciId(participant?.uciId || '')
    setTeamName(participant?.team || '')

    const { result: matchingRaceResult, prime: matchingEventPrime } = findMatchingRaceResultAndPrime()
    setAthleteRaceEventResult(matchingRaceResult)
    setAthleteRaceEventPrime(matchingEventPrime)
  }, [participantId])

  const [athleteRaceEventResult, setAthleteRaceEventResult] = useState<ParticipantResult | null>(null)
  const [athleteRaceEventPrime, setAthleteRaceEventPrime] = useState<PrimeResult | null>(null)

  const findMatchingRaceResultAndPrime = () => {
    let matchingRaceResult: ParticipantResult | null = null
    let matchingEventPrime: PrimeResult | null = null

    const participant = form.getValues().standings[index]
    if (!participant) return { result: null, prime: null }

    if (uciId) {
      matchingRaceResult = raceEventResults.find(r => r.uciId === uciId) || null
    } else if (athleteName) {
      matchingRaceResult = raceEventResults.find(r => r.firstName === participant.firstName && r.lastName === participant.lastName) || null
    }

    if (matchingRaceResult) {
      matchingEventPrime = raceEventPrimes.find(p => p.participantId === matchingRaceResult.participantId) || null
    }

    return { result: matchingRaceResult, prime: matchingEventPrime }
  }

  const handleAthleteChange = ({ name, uciId: athleteUciId }: { name?: string; uciId?: string }) => {
    let matchingAthlete
    if (athleteUciId) {
      matchingAthlete = findAthlete({ uciId: athleteUciId })
    } else if (name && /\(.+\)$/.test(name.trim())) {
      // Ignore FIRSTNAME LASTNAME (UCIID) that is passed as a duplicate onChange() from AthleteAutocomplete when selecting an option
      return
    }

    if (matchingAthlete) {
      form.setFieldValue(`standings.${index}.firstName`, matchingAthlete.firstName)
      form.setFieldValue(`standings.${index}.lastName`, matchingAthlete.lastName)
      form.setFieldValue(`standings.${index}.uciId`, matchingAthlete.uciId)
      setAthleteName(`${matchingAthlete.firstName} ${matchingAthlete.lastName}`)
      setUciId(matchingAthlete.uciId)

      if (!teamName?.length && matchingAthlete.teams[CURRENT_YEAR]) {
        form.setFieldValue(`standings.${index}.team`, matchingAthlete.teams[CURRENT_YEAR].name)
        setTeamName(matchingAthlete.teams[CURRENT_YEAR].name!)
      }
    } else if (name !== undefined) {
      const parts = name.trim().split(/\s+/)
      form.setFieldValue(`standings.${index}.firstName`, parts[0] || '')
      form.setFieldValue(`standings.${index}.lastName`, parts.slice(1).join(' ') || '')
      setAthleteName(name)
    }

    const { result: matchingRaceResult, prime: matchingEventPrime } = findMatchingRaceResultAndPrime()
    setAthleteRaceEventResult(matchingRaceResult)
    setAthleteRaceEventPrime(matchingEventPrime)

    onValueChange()
  }

  const handleRevert = () => {
    const initialRow = form.getInitialValues().standings[index]
    if (!initialRow) return

    const next = [...form.getValues().standings]
    next[index] = initialRow
    form.setValues({ standings: next })

    setAthleteName([initialRow.firstName, initialRow.lastName].filter(Boolean).join(' '))
    setUciId(initialRow.uciId || '')
    setTeamName(initialRow.team || '')

    form.setFieldError(`standings.${index}.firstName`, null)
    form.setFieldError(`standings.${index}.bibNumber`, null)
    form.setFieldError(`standings.${index}.uciId`, null)
    form.setFieldError(`standings.${index}.points`, null)

    onFormValuesChange(form.getValues().standings[index])
  }

  const canRevert = !!form.getInitialValues().standings[index]

  return (
    <Table.Tr>
      <Table.Td w={40}>
        <Text size="sm" ta="center">{index + 1}</Text>
      </Table.Td>

      <Table.Td w={60}>
        <NumberInput
          size="xs"
          hideControls
          placeholder="Bib"
          styles={getFieldStyles('bibNumber', !!form.errors[`standings.${index}.bibNumber`])}
          {...form.getInputProps(`standings.${index}.bibNumber`)}
          error={undefined}
          rightSection={<InputErrorIcon error={form.errors[`standings.${index}.bibNumber`]}/>}
          onBlur={() => {
            form.validateField(`standings.${index}.bibNumber`)
            onValueChange()
          }}
        />
      </Table.Td>

      <Table.Td style={{ minWidth: 220 }}>
        <AthleteAutocomplete
          size="xs"
          value={athleteName}
          uciId={uciId}
          onChange={value => handleAthleteChange({ name: value })}
          onOptionSubmit={value => handleAthleteChange({ uciId: value })}
          onBlur={() => form.validateField(`standings.${index}.firstName`)}
          styles={getFieldStyles(['firstName', 'lastName'], !!form.errors[`standings.${index}.firstName`])}
          rightSection={!!form.errors[`standings.${index}.firstName`] &&
            <InputErrorIcon error={form.errors[`standings.${index}.firstName`]}/>}
        />
      </Table.Td>

      <Table.Td w={130}>
        <NumberInput
          size="xs"
          hideControls
          maxLength={11}
          placeholder="UCI ID"
          styles={getFieldStyles('uciId', !!form.errors[`standings.${index}.uciId`])}
          error={undefined}
          rightSection={<InputErrorIcon error={form.errors[`standings.${index}.uciId`]}/>}
          value={uciId}
          onChange={val => {
            const v = String(val ?? '')
            setUciId(v)
            form.setFieldValue(`standings.${index}.uciId`, v)
          }}
          onBlur={() => {
            form.validateField(`standings.${index}.uciId`)
            onValueChange()
          }}
        />
      </Table.Td>

      <Table.Td style={{ minWidth: 150 }}>
        <TeamAutocomplete
          size="xs"
          placeholder="Team"
          styles={getFieldStyles('team')}
          valueAttribute="name"
          rightSection={<InputErrorIcon error={form.errors[`standings.${index}.team`]}/>}
          value={teamName}
          onChange={value => {
            setTeamName(value)
            form.setFieldValue(`standings.${index}.team`, value)
            onValueChange()
          }}
        />
      </Table.Td>

      <Table.Td w={130}>
        <NumberInput
          size="xs"
          hideControls
          placeholder="Points"
          styles={getFieldStyles('points', !!form.errors[`standings.${index}.points`])}
          {...form.getInputProps(`standings.${index}.points`)}
          error={undefined}
          rightSection={<InputErrorIcon error={form.errors[`standings.${index}.points`]}/>}
          onBlur={() => {
            form.validateField(`standings.${index}.points`)

            if (index > 0) form.validateField(`standings.${index - 1}.points`)
            if (!isLast) form.validateField(`standings.${index + 1}.points`)

            onPointChange()
            onValueChange()
          }}
        />
      </Table.Td>

      {!!raceEventResults.length && (
        <>
          <Table.Td w={110} style={{ textAlign: 'center' }}>
            {athleteRaceEventResult?.position}
          </Table.Td>

          <Table.Td w={80} style={{ textAlign: 'center' }}>
            {athleteRaceEventPrime?.position}
          </Table.Td>
        </>
      )}

      <Table.Td w={50}>
        <Group gap={2} wrap="nowrap" justify="flex-end">
          <Tooltip label="Revert changes" withArrow disabled={!canRevert}>
            <ActionIcon size="sm" variant="subtle" color="gray" disabled={!canRevert} onClick={handleRevert}>
              <IconArrowBackUp size={16}/>
            </ActionIcon>
          </Tooltip>
          <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(participantId)}>
            <IconTrash size={16}/>
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}
