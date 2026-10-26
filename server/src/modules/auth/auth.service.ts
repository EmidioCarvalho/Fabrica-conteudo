import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ENV } from '../../config/env'
import { UserRepo, UserEntity } from '../../db/store'
import { sendVerificationEmail } from '../email/email.service'

function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const AuthService = {
  async register(data: { name: string; email: string; password: string; role: 'SOLICITANTE' | 'EDITOR' | 'DEVOPS' }) {
    const { name, email, password, role } = data

    if (!name || !email || !password || !role) {
      throw new Error('Todos os campos (nome, email, senha, papel) são obrigatórios.')
    }

    const existing = await UserRepo.findByEmail(email)
    if (existing) {
      throw new Error('Já existe uma conta cadastrada com este e-mail.')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = generate6DigitCode()
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    const user = await UserRepo.create({
      name,
      email,
      passwordHash,
      role,
      status: 'PENDING',
      emailVerified: false,
      verificationToken: verificationCode,
      tokenExpiresAt,
    })

    // Dispara e-mail com o código de 6 dígitos
    await sendVerificationEmail(email, name, verificationCode)

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      status: user.status,
      message: 'Usuário cadastrado com sucesso. Um código de 6 dígitos foi enviado para o seu e-mail.',
    }
  },

  async verifyEmail(email: string, code: string) {
    if (!email || !code) {
      throw new Error('E-mail e código de verificação são obrigatórios.')
    }

    const user = await UserRepo.findByEmail(email)
    if (!user) {
      throw new Error('Usuário não encontrado.')
    }

    if (user.emailVerified) {
      return { success: true, message: 'E-mail já se encontra verificado.' }
    }

    if (!user.verificationToken || user.verificationToken !== code.trim()) {
      throw new Error('Código de verificação inválido.')
    }

    if (user.tokenExpiresAt && new Date() > new Date(user.tokenExpiresAt)) {
      throw new Error('Código expirado. Solicite um novo código de verificação.')
    }

    // Ativa o usuário
    const updated = await UserRepo.update(user.id, {
      emailVerified: true,
      status: 'ACTIVE',
      verificationToken: null,
      tokenExpiresAt: null,
    })

    return {
      success: true,
      message: 'E-mail verificado com sucesso! Você já pode realizar o login.',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      },
    }
  },

  async resendCode(email: string) {
    if (!email) throw new Error('E-mail é obrigatório.')

    const user = await UserRepo.findByEmail(email)
    if (!user) throw new Error('Usuário não encontrado.')

    if (user.emailVerified) {
      throw new Error('Este e-mail já foi verificado.')
    }

    const verificationCode = generate6DigitCode()
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await UserRepo.update(user.id, {
      verificationToken: verificationCode,
      tokenExpiresAt,
    })

    await sendVerificationEmail(user.email, user.name, verificationCode)

    return {
      success: true,
      message: 'Novo código de verificação enviado com sucesso para seu e-mail.',
    }
  },

  async login(email: string, pass: string) {
    if (!email || !pass) {
      throw new Error('E-mail e senha são obrigatórios.')
    }

    const user = await UserRepo.findByEmail(email)
    if (!user) {
      throw new Error('E-mail ou senha inválidos.')
    }

    const passwordMatch = await bcrypt.compare(pass, user.passwordHash)
    if (!passwordMatch) {
      throw new Error('E-mail ou senha inválidos.')
    }

    // BLOQUEIA LOGIN DE USUÁRIOS NÃO VERIFICADOS
    if (!user.emailVerified) {
      const error: any = new Error('E-mail não verificado. Digite o código de 6 dígitos enviado para ativar sua conta.')
      error.statusCode = 403
      error.emailVerified = false
      error.email = user.email
      throw error
    }

    if (user.status === 'BLOCKED') {
      throw new Error('Conta bloqueada. Contate o administrador do sistema.')
    }

    const payload = { id: user.id, email: user.email, role: user.role }
    const accessToken = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '2h' })
    const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      },
    }
  },
}
