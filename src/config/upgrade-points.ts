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