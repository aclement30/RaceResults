import type { Context, EventBridgeEvent } from 'aws-lambda'
import { importRawData } from './import.ts'
import { cleanData } from './clean.ts'

export const handler = async (event: EventBridgeEvent<any, any>, _?: Context) => {
  const importResult = await importRawData()
  const cleanResult = await cleanData()

  return {
    import: importResult,
    clean: cleanResult,
  }
}