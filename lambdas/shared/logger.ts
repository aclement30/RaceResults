import 'colors'
import { ENV } from './config.ts'

type LogLevel = 'info' | 'warn' | 'error'

const log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  const stringifiedMessage = JSON.stringify({
    'level': level.toUpperCase(),
    'time': new Date().toISOString(),
    'msg': message,
    ...(context || {})
  })

  if (level === 'error') console[level](ENV === 'dev' ? stringifiedMessage.red : stringifiedMessage)
  else if (level === 'warn') console[level](ENV === 'dev' ? stringifiedMessage.yellow : stringifiedMessage)
  else console[level](stringifiedMessage)
}

class Logger {
  private _context?: Record<string, any>

  constructor(context?: Record<string, any>) {
    this._context = context
  }

  info(message: string, context?: Record<string, any>) {
    log('info', message, { ...(this._context || {}), ...(context || {}) })
  }

  warn(message: string, context?: Record<string, any>) {
    log('warn', message, { ...(this._context || {}), ...(context || {}) })
  }

  error(message: string | Error | unknown, context?: Record<string, any>) {
    if (message instanceof Error) {
      const stack = message.stack ? message.stack.split('\n').slice(1).join('\n') : undefined
      log('error', message.message, { stack, ...(this._context || {}), ...(context || {}) })
    } else {
      const stack = context?.error && context.error instanceof Error ? context.error.stack?.split('\n').slice(1).join('\n') : undefined
      log('error', message as string, { stack, ...(this._context || {}), ...(context || {}) })
    }
  }

  child(context?: Record<string, any>) {
    return new Logger(context)
  }
}

const logger = new Logger()

export default logger