import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

type JwtPayload = {
  userId?: string
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
    res.status(401).json({ error: 'Token não informado' })
    return
  }

  const token = authorization.slice('Bearer '.length)

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload

    if (!payload.userId) {
      res.status(401).json({ error: 'Token inválido' })
      return
    }

    ;(req as AuthenticatedRequest).userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}
