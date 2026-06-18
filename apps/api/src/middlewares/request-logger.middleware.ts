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

function nowIso(): string {
  return new Date().toISOString()
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

function statusOutcome(statusCode: number): 'success' | 'client_error' | 'server_error' {
  if (statusCode >= 500) return 'server_error'
  if (statusCode >= 400) return 'client_error'
  return 'success'
}

function writeLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: LogDetails): void {
  const suffix = details ? ` ${JSON.stringify(details)}` : ''
  const line = `[${nowIso()}] [${level}] ${message}${suffix}`

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
    requestId,
    source,
    method: req.method,
    path: req.originalUrl || req.url,
    ...(Object.keys(req.query).length > 0 && { query: sanitizeForLog(req.query) }),
    ...(isWrite && req.body && Object.keys(req.body).length > 0 && { body: sanitizeForLog(req.body) }),
  })

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO'

    writeLog(level, 'request.finished', {
      requestId,
      source,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      outcome: statusOutcome(res.statusCode),
      durationMs,
      userId: req.userId,
      response: responsePayload,
    })
  })

  next()
}

export function requestErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const error = err instanceof Error ? err : new Error(String(err))

  writeLog('ERROR', 'request.unhandled_error', {
    requestId: req.requestId,
    source: req.requestSource,
    method: req.method,
    path: req.originalUrl || req.url,
    userId: req.userId,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    },
  })

  if (res.headersSent) {
    return
  }

  res.status(500).json({ error: 'Erro interno do servidor' })
}
