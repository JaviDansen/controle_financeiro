import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Estendendo o tipo Request do Express para incluir o userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente ou mal formatado' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string }
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}