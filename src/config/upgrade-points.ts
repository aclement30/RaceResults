export const BC_SANCTIONED_EVENT_TYPES = {
  GRASSROOTS: 'Grassroots Race',
  A: 'A-Race',
  AA: 'AA-Race',
  'AA-USA': 'AA-USA',
  'CYCLING-CANADA': 'Cycling Canada',
  'MASS-PARTICIPATION': 'Mass Participation Race',
}

export const BC_UPGRADE_POINT_RULES = [
  { fieldSize: [1, 3], points: [8] },
  { fieldSize: [4, 5], points: [8, 6] },
  { fieldSize: [6, 7], points: [8, 6, 5] },
  { fieldSize: [8, 9], points: [8, 6, 5, 4] },
  { fieldSize: [10, 11], points: [8, 6, 5, 4, 3] },
  { fieldSize: [12, 13], points: [8, 6, 5, 4, 3, 2] },
  { fieldSize: [14, 14], points: [8, 6, 5, 4, 3, 2, 1] },
  { fieldSize: [15, 40], points: [10, 8, 6, 5, 4, 3, 2, 1, 1, 1] },
  { fieldSize: [41, 100], points: [12, 10, 8, 7, 6, 5, 4, 3, 2, 1] },
]

export const COMBINED_RACE_CATEGORIES: Record<string, string[][]> = {
  // BC Provincial RR: https://www.victoriacyclingleague.com/_files/ugd/0d2628_ea4801793b964a2bb73245e26e17d35e.pdf
  '75919fe9': [
    [
      'master-c-55-64-m',
      'master-d-65-m',
    ],
    [
      'master-a-35-44-w',
      'master-b-45-54-w',
      'master-c-55-64-w',
    ],
    [
      'elite-w',
      'u23-w',
    ],
    [
      'elite-m',
      'u23-m',
    ],
  ],
  // BC Provincial Crit:
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-0800-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-0845-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-0930-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1025-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1120-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1200-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1255-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1350-startlist.pdf
  // - https://results.wimsey.co/2025/VictoriaCycling/BCProvincials/2025-06-01-BC_Provincial_Crit-1500-startlist.pdf
  '16b74229': [
    [
      'master-a-35-44-w',
      'master-b-45-54-w',
      'master-c-55-64-w',
    ],
    [
      'master-c-55-64-m',
      'master-d-65-m',
    ],
    [
      'open-youth-m',
      'open-youth-w',
      'open-youth-b-m',
      'open-youth-b-w',
    ],
    [
      'u17-m',
      'u19-m',
    ],
    [
      'u17-w',
      'u19-w',
    ],
    [
      'elite-w',
      'u23-w',
    ],
    [
      'elite-m',
      'u23-m',
    ]
  ],
}