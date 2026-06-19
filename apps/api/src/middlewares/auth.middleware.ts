import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { logRequestEvent } from './request-logger.middleware'

type JwtPayload = {
  userId?: string
}

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export type AuthenticatedRequest = Request & {
  userId: string
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? 'test-secret'
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    logRequestEvent(req, 'auth.token_missing')
    res.status(401).json({ error: 'Token não informado' })
    return
  }

  const token = authorization.slice('Bearer '.length)

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload

    if (!payload.userId) {
      logRequestEvent(req, 'auth.token_invalid_payload')
      res.status(401).json({ error: 'Token inválido' })
      return
    }

    req.userId = payload.userId
    logRequestEvent(req, 'auth.token_verified', { userId: payload.userId })
    next()
  } catch {
    logRequestEvent(req, 'auth.token_invalid')
    res.status(401).json({ error: 'Token inválido' })
  }
}
