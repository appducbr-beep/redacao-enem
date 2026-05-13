type LogLevel = 'info' | 'warn' | 'error'

type LogPayload = {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const SENSITIVE_KEYS = ['cpf', 'phone', 'token', 'api_key', 'password', 'secret', 'text', 'content', 'cvv', 'card']

export function sanitizeLogContext(ctx: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(ctx)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) continue
    result[key] = value
  }
  return result
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const payload: LogPayload = {
    level,
    message,
    context: context ? sanitizeLogContext(context) : undefined,
    timestamp: new Date().toISOString(),
  }
  const line = `[reda1000] ${JSON.stringify(payload)}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  log('info', message, context)
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  log('warn', message, context)
}

export function logError(message: string, context?: Record<string, unknown>): void {
  log('error', message, context)
}
