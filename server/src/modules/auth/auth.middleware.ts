import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ENV } from '../../config/env'
import { UserRepo, UserEntity } from '../../db/store'

export interface AuthRequest extends Request {
  user?: UserEntity
}

export async function authGuard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token =
      req.cookies?.fabrica_token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null)

    if (!token) {
      res.status(401).json({ error: 'Não autenticado. Token não fornecido.' })
      return
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string }
    const user = await UserRepo.findById(decoded.id)

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado ou sessão expirada.' })
      return
    }

    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' })
  }
}

export function requireRole(...roles: Array<'SOLICITANTE' | 'EDITOR' | 'DEVOPS'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado para o seu perfil de usuário.' })
      return
    }
    next()
  }
}
