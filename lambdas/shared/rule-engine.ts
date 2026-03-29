import { Engine } from 'json-rules-engine'
import data from './data.ts'

class RuleEngineSingleton {
  private _engines: Record<string, Engine> = {}

  public async init() {
    if (Object.keys(this._engines).length > 0) return

    const rulesByAttribute = await data.get.rules()

    for (const [attribute, rules] of Object.entries(rulesByAttribute)) {
      const engine = new Engine([], { allowUndefinedFacts: true })

      engine.addOperator('containsCI', (factValue: unknown, ruleValue: unknown) =>
        typeof factValue === 'string' && typeof ruleValue === 'string' &&
        factValue.toLowerCase().includes(ruleValue.toLowerCase())
      )
      engine.addOperator('doesNotContainCI', (factValue: unknown, ruleValue: unknown) =>
        typeof factValue === 'string' && typeof ruleValue === 'string' &&
        !factValue.toLowerCase().includes(ruleValue.toLowerCase())
      )
      engine.addOperator('startsWithCI', (factValue: unknown, ruleValue: unknown) =>
        typeof factValue === 'string' && typeof ruleValue === 'string' &&
        factValue.toLowerCase().startsWith(ruleValue.toLowerCase())
      )
      engine.addOperator('endsWithCI', (factValue: unknown, ruleValue: unknown) =>
        typeof factValue === 'string' && typeof ruleValue === 'string' &&
        factValue.toLowerCase().endsWith(ruleValue.toLowerCase())
      )
      engine.addOperator('equalCI', (factValue: unknown, ruleValue: unknown) =>
        typeof factValue === 'string' && typeof ruleValue === 'string' &&
        factValue.toLowerCase() === ruleValue.toLowerCase()
      )
      engine.addOperator('always', () => true)

      for (const rule of rules) {
        engine.addRule(rule)
      }

      this._engines[attribute] = engine
    }
  }

  public async matchAttribute<T>(object: Record<string, unknown>, attribute: string): Promise<T | null> {
    const engine = this._engines[attribute]
    if (!engine) {
      throw new Error('No rules found for attribute: ' + attribute)
    }

    const { events } = await engine.run(object)
    if (events.length === 0) return null

    // Events are returned in priority order — first match wins
    return (events[0].params?.value as T) ?? null
  }
}

const RuleEngine = new RuleEngineSingleton()

export { RuleEngine }
