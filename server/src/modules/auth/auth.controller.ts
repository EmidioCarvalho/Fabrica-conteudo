import { Router, Request, Response } from 'express'
import { AuthService } from './auth.service'
import { authGuard, AuthRequest } from './auth.middleware'
import { ENV } from '../../config/env'

export const authRouter = Router()

const isProd = ENV.NODE_ENV === 'production'

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body
    const result = await AuthService.register({ name, email, password, role })
    res.status(201).json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao registrar usuário' })
  }
})

// POST /api/auth/verify-email
authRouter.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body
    const result = await AuthService.verifyEmail(email, code)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao verificar e-mail' })
  }
})

// POST /api/auth/resend-code
authRouter.post('/resend-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    const result = await AuthService.resendCode(email)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao reenviar código' })
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    const { accessToken, refreshToken, user } = await AuthService.login(email, password)

    // Cookies HTTP-Only seguros
    res.cookie('fabrica_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000, // 2 horas
    })

    res.cookie('fabrica_refresh', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    })

    res.json({
      user,
      token: accessToken,
      message: 'Login realizado com sucesso',
    })
  } catch (err: any) {
    const statusCode = err.statusCode || 401
    res.status(statusCode).json({
      error: err.message || 'Credenciais inválidas',
      emailVerified: err.emailVerified,
      email: err.email,
    })
  }
})

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('fabrica_token')
  res.clearCookie('fabrica_refresh')
  res.json({ success: true, message: 'Logout realizado com sucesso' })
})

// GET /api/auth/me
authRouter.get('/me', authGuard, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }
  const { passwordHash: _p, verificationToken: _v, ...safeUser } = req.user
  res.json({ user: safeUser })
})
