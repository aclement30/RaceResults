// import pino from 'pino'

const TODAY = new Date().toISOString().slice(0, 10)

// const fileTransport = pino.transport({
//   target: 'pino/file',
//   options: { destination: `${LOG_PATH}/${TODAY}.log` },
// })
//
// const logger = pino({
//     level: process.env.PINO_LOG_LEVEL || 'info',
//     formatters: {
//       bindings: (bindings) => {
//         // Remove pid & hostname fields
//         return {}
//       },
//       level: (label) => {
//         return { level: label.toUpperCase() }
//       },
//     },
//     timestamp: pino.stdTimeFunctions.isoTime,
//   },
//   fileTransport
// )

type LogLevel = 'info' | 'warn' | 'error'

const log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  console[level](JSON.stringify({
    'level': level.toUpperCase(),
    'time': new Date().toISOString(),
    'msg': message,
    ...(context || {})
  }))
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