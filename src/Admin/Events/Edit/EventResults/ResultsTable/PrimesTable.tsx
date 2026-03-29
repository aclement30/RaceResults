import { ActionIcon, Button, NumberInput, Select, Table, Text } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import React, { useContext, useState } from 'react'
import type { PrimeResult } from '../../../../../../shared/types'
import { ResultsFormContext } from '../ResultsFormContext'
import { participantName } from '../utils'

export const PrimesTable: React.FC = () => {
  const formRef = useContext(ResultsFormContext)!
  const [primes, setPrimes] = useState<PrimeResult[]>(() => formRef.current.getValues().primes)

  const results = formRef.current.getValues().results

  const athleteOptions = results
    .filter(r => r.firstName || r.lastName)
    .map(r => ({
      value: r.participantId,
      label: [r.bibNumber != null ? String(r.bibNumber) : null, participantName(r)]
        .filter(Boolean)
        .join(' - '),
    }))

  const update = (nextPrimes: PrimeResult[]) => {
    setPrimes(nextPrimes)
    formRef.current.setFieldValue('primes', nextPrimes)
  }

  const handleAdd = () => {
    const nextNumber = primes.length > 0 ? Math.max(...primes.map(p => p.number)) + 1 : 1
    const nextPosition = primes.length > 0 ? Math.max(...primes.map(p => p.position)) + 1 : 1
    update([...primes, { participantId: '', number: nextNumber, position: nextPosition }])
  }

  const handleDelete = (index: number) => {
    update(primes.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, updates: Partial<PrimeResult>) => {
    update(primes.map((p, i) => i === index ? { ...p, ...updates } : p))
  }

  return (
    <>
      {primes.length > 0 && (
        <Table striped highlightOnHover horizontalSpacing={4} verticalSpacing={4} mb="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={90}>Prime #</Table.Th>
              <Table.Th>Athlete</Table.Th>
              <Table.Th w={90}>Position</Table.Th>
              <Table.Th w={40}/>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {primes.map((prime, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    w={70}
                    hideControls
                    min={1}
                    value={prime.number}
                    onChange={val => handleChange(index, { number: typeof val === 'number' ? val : prime.number })}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={240}
                    data={athleteOptions}
                    value={prime.participantId || null}
                    placeholder="Select athlete…"
                    searchable
                    clearable
                    onChange={val => handleChange(index, { participantId: val ?? '' })}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    w={70}
                    hideControls
                    min={1}
                    value={prime.position}
                    onChange={val => handleChange(index, { position: typeof val === 'number' ? val : prime.position })}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(index)}>
                    <IconTrash size={16}/>
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {primes.length === 0 && (
        <Text size="sm" c="dimmed" mb="sm">No primes yet.</Text>
      )}

      <Button size="sm" variant="light" leftSection={<IconPlus size={14}/>} onClick={handleAdd}>
        Add Prime
      </Button>
    </>
  )
}
