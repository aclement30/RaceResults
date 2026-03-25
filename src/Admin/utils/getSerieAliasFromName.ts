import capitalize from 'lodash/capitalize'

export const getSerieAliasFromName = (name: string) => {
  // if the name is LETTERS followed by a number, it's likely a series name with a year, so we UPPERCASE the letters and keep the number as is
  const match = name.match(/^([a-zA-Z]+)\s(\d{4})$/)
  if (match) {
    const letters = match[1].toUpperCase()
    const year = match[2]
    return letters + year
  }

  // If the alias is all uppercase, we assume it's a series name with no year, so we just return it as is
  if (name === name.toUpperCase()) return name

  // Otherwise capitalize each word and join without spaces, preserving all-uppercase words as acronyms
  // e.g. "BC Provincials" → "BCProvincials", "Masters National" → "MastersNational"
  return name.split(' ')
    .map(word => word === word.toUpperCase() ? word : capitalize(word.toLowerCase()))
    .join('')
}

export const getSerieNameFromAlias = (alias: string | null) => {
  if (!alias) return null

  // If the alias is LETTERS followed by a number, we assume it's a series name with a year, so we separate the letters and the number with a space and UPPERCASE the letters
  const match = alias.match(/^([A-Z]+)(\d{4})$/)
  if (match) {
    const letters = match[1]
    const year = match[2]
    return letters.toUpperCase() + ' ' + year
  }

  // If the alias is all uppercase, we assume it's a series name with no year, so we just return it as is
  if (alias === alias.toUpperCase()) return alias

  // Otherwise, split on camelCase/PascalCase boundaries while preserving acronyms
  // e.g. BCProvincials → BC Provincials, MastersNational → Masters National
  return alias
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
}