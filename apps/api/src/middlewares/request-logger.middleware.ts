import { NextFunction, Request, Response } from 'express'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      requestSource?: string
    }
  }
}

type LogDetails = Record<string, unknown>

const REDACTED_KEYS = new Set([
  'password',
  'confirmpassword',
  'passwordhash',
  'token',
  'authorization',
  'jwt',
  'secret',
  'newpassword',
])

function nowTime(): string {
  return new Date().toTimeString().slice(0, 8)
}

function createRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function truncate(value: string, limit = 180): string {
  return value.length > limit ? `${value.slice(0, limit)}...` : value
}

function sanitizeForLog(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeForLog(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        if (REDACTED_KEYS.has(key.toLowerCase())) {
          return [key, '[REDACTED]']
        }

        return [key, sanitizeForLog(nestedValue)]
      })
    )
  }

  if (typeof value === 'string') {
    return truncate(value)
  }

  return value
}

function sourceFromPath(method: string, path: string): string {
  const cleanPath = path.split('?')[0]
  const explicitMap: Record<string, string> = {
    'GET /health': 'system.health',
    'GET /hello': 'system.hello',
    'POST /auth/register': 'auth.register',
    'POST /auth/login': 'auth.login',
    'POST /auth/logout': 'auth.logout',
    'POST /auth/forgot-password': 'auth.forgot-password',
    'POST /auth/reset-password': 'auth.reset-password',
    'GET /cards': 'cards.list',
    'POST /cards': 'cards.create',
  }

  const explicit = explicitMap[`${method.toUpperCase()} ${cleanPath}`]
  if (explicit) {
    return explicit
  }

  const segments = cleanPath.split('/').filter(Boolean)
  const resource = segments[0] ?? 'root'
  const action = segments[1] ?? method.toLowerCase()
  return `${resource}.${action}`
}

const SLOW_REQUEST_MS = 2000

function statusOutcome(statusCode: number): 'success' | 'client_error' | 'server_error' {
  if (statusCode >= 500) return 'server_error'
  if (statusCode >= 400) return 'client_error'
  return 'success'
}

const LEVEL_ABBR: Record<'INFO' | 'WARN' | 'ERROR', string> = {
  INFO: 'INF',
  WARN: 'WRN',
  ERROR: 'ERR',
}

function toLogfmt(details: LogDetails): string {
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return str.includes(' ') ? `${k}="${str}"` : `${k}=${str}`
    })
    .join(' ')
}

function writeLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: LogDetails): void {
  const suffix = details ? ` ${toLogfmt(details)}` : ''
  const line = `${nowTime()} [${LEVEL_ABBR[level]}] ${message}${suffix}`

  if (level === 'ERROR') {
    console.error(line)
    return
  }

  if (level === 'WARN') {
    console.warn(line)
    return
  }

  console.log(line)
}

export function logRequestEvent(req: Request, event: string, details?: LogDetails): void {
  writeLog('INFO', event, {
    requestId: req.requestId,
    source: req.requestSource,
    ...details,
  })
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now()
  const requestId = createRequestId()
  const source = sourceFromPath(req.method, req.originalUrl || req.url)
  let responsePayload: unknown

  req.requestId = requestId
  req.requestSource = source

  const originalJson = res.json.bind(res)
  res.json = ((body: unknown) => {
    responsePayload = sanitizeForLog(body)
    return originalJson(body)
  }) as Response['json']

  const isWrite = ['POST', 'PUT', 'PATCH'].includes(req.method)
  writeLog('INFO', 'request.started', {
    rid: requestId.split('-')[0],
    method: req.method,
    path: req.originalUrl || req.url,
    ...(Object.keys(req.query).length > 0 && { query: JSON.stringify(sanitizeForLog(req.query)) }),
    ...(isWrite && req.body && Object.keys(req.body).length > 0 && { body: JSON.stringify(sanitizeForLog(req.body)) }),
  })

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    const isSlow = durationMs > SLOW_REQUEST_MS
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 || isSlow ? 'WARN' : 'INFO'
    const event = isSlow ? 'request.slow' : 'request.finished'

    writeLog(level, event, {
      rid: requestId.split('-')[0],
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      outcome: statusOutcome(res.statusCode),
      ms: durationMs,
      uid: req.userId ? req.userId.slice(0, 8) : undefined,
    })
  })

  next()
}

export function requestErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const error = err instanceof Error ? err : new Error(String(err))

  writeLog('ERROR', 'request.unhandled_error', {
    rid: req.requestId?.split('-')[0],
    method: req.method,
    path: req.originalUrl || req.url,
    uid: req.userId ? req.userId.slice(0, 8) : undefined,
    error: error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  })

  if (res.headersSent) {
    return
  }

  res.status(500).json({ error: 'Erro interno do servidor' })
}
