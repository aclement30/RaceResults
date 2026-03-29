import { s3 as RRS3 } from '../utils.ts'
import { RULES_PATH } from '../config.ts'
import type { RuleProperties } from 'json-rules-engine'

export const getRules = async (): Promise<Record<string, RuleProperties[]>> => {
  const { files } = await RRS3.fetchDirectoryFiles(RULES_PATH)

  if (!files || files.length === 0) return {}

  const fileContents = await Promise.all(files.map(file => RRS3.fetchFile(file.Key!)))

  const rulesByAttribute: Record<string, RuleProperties[]> = {}

  for (const content of fileContents) {
    if (!content) continue

    const rules = JSON.parse(content) as RuleProperties[]

    if (rules && Array.isArray(rules) && rules.length > 0) {
      // Derive the attribute name from the event type of the first rule
      const attribute = (rules[0].event as { type: string }).type
      rulesByAttribute[attribute] = rules
    }
  }

  return rulesByAttribute
}
