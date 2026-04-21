// export function parseWithMapping(
//   content: string,
//   mapping: ColumnMapping,
// ): ParticipantResult[] {
//   return parseCsvContent(content).map((row, i) => {
//     const statusRaw = (row[mapping.status ?? ''] ?? '').toUpperCase()
//     const status = (['DNF', 'DNS', 'OTL'].includes(statusRaw)
//       ? statusRaw
//       : 'FINISHER') as ParticipantResult['status']
//
//     const { firstName, lastName } = parseAthleteName(row, mapping)
//     const finishGapRaw = row[mapping.finishGap ?? ''] ?? ''
//     const avgSpeedRaw = row[mapping.avgSpeed ?? ''] ?? ''
//     const ageRaw = row[mapping.age ?? ''] ?? ''
//
//     return {
//       participantId: `p-${Date.now()}-${i}`,
//       position: parseInt(row[mapping.position ?? '']) || i + 1,
//       bibNumber: parseInt(row[mapping.bib ?? '']) || undefined,
//       firstName,
//       lastName,
//       team: row[mapping.team ?? ''] || undefined,
//       finishTime: parseTime(row[mapping.finishTime ?? ''] ?? ''),
//       finishGap: finishGapRaw ? parseTime(finishGapRaw) || parseFloat(finishGapRaw) || undefined : undefined,
//       avgSpeed: avgSpeedRaw ? parseFloat(avgSpeedRaw) || undefined : undefined,
//       status,
//       uciId: row[mapping.uciId ?? ''] || undefined,
//       city: row[mapping.city ?? ''] || undefined,
//       province: row[mapping.province ?? ''] || undefined,
//       license: row[mapping.license ?? ''] || undefined,
//       age: ageRaw ? parseInt(ageRaw) || undefined : undefined,
//       nationality: row[mapping.nationality ?? ''] || undefined,
//     }
//   })
// }