import { useState } from 'react'
import { CheckCircle2, Factory, KeyRound, Loader2, Lock, Mail, RefreshCw, UserCheck, UserPlus, Users } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { Role } from '../../types'

type AuthMode = 'login' | 'register' | 'verify'

export default function LoginScreen() {
  const { login, register, verifyEmail, resendCode, toast } = useStore()

  const [mode, setMode] = useState<AuthMode>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Campos
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SOLICITANTE')
  const [code, setCode] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setBusy(true)

    const res = await login(email, password)
    setBusy(false)

    if (res.unverified) {
      setError('Sua conta ainda não foi verificada.')
      setMode('verify')
      toast('Digite o código de 6 dígitos enviado para seu e-mail.', 'info')
    } else if (!res.success) {
      setError(res.error || 'E-mail ou senha inválidos.')
      toast(res.error || 'E-mail ou senha inválidos', 'error')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setBusy(true)
    const res = await register({ name, email, password, role })
    setBusy(false)

    if (res.success) {
      setSuccessMsg(res.message || 'Cadastro realizado com sucesso! Verifique seu e-mail.')
      toast('Código de verificação enviado!', 'info')
      setMode('verify')
    } else {
      setError(res.error || 'Falha ao registrar usuário.')
      toast(res.error || 'Falha ao cadastrar', 'error')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (code.trim().length !== 6) {
      setError('Informe o código de 6 dígitos.')
      return
    }

    setBusy(true)
    const res = await verifyEmail(email, code.trim())
    setBusy(false)

    if (res.success) {
      setSuccessMsg('E-mail verificado com sucesso! Você já pode entrar.')
      toast('E-mail verificado! Faça seu login.', 'success')
      setMode('login')
      setCode('')
    } else {
      setError(res.error || 'Código inválido ou expirado.')
      toast(res.error || 'Código inválido', 'error')
    }
  }

  const handleResend = async () => {
    setError('')
    setBusy(true)
    const res = await resendCode(email)
    setBusy(false)

    if (res.success) {
      toast('Novo código enviado por e-mail!', 'info')
    } else {
      setError(res.error || 'Não foi possível reenviar o código.')
      toast(res.error || 'Falha ao reenviar', 'error')
    }
  }

  const fillQuickUser = (userEmail: string, roleName: string) => {
    setEmail(userEmail)
    setPassword('123456')
    setMode('login')
    setError('')
    toast(`Preenchido: ${roleName}`, 'info')
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-900 p-4">
      {/* Luzes decorativas de fundo */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <main className="animate-in relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-100">
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-white shadow-lg shadow-brand-500/30">
            <Factory size={26} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">Fábrica de Conteúdo</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'login' && 'Entre para acessar a esteira editorial'}
            {mode === 'register' && 'Crie sua conta para solicitar ou produzir posts'}
            {mode === 'verify' && 'Confirmação de segurança e ativação'}
          </p>
        </div>

        {/* Abas Alternadoras (Login / Cadastro) */}
        {mode !== 'verify' && (
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              className={`rounded-lg py-2 transition ${mode === 'login' ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-900'}`}
              onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`rounded-lg py-2 transition ${mode === 'register' ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-900'}`}
              onClick={() => { setMode('register'); setError(''); setSuccessMsg('') }}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Mensagens de Feedback */}
        {error && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-800 ring-1 ring-green-200">
            <CheckCircle2 size={16} className="shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. MODO LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="label">E-mail corporativo</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  className="input !pl-9"
                  placeholder="voce@fabrica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="label">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="input !pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={busy} className="btn-primary w-full !py-2.5 shadow-lg shadow-brand-500/25">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Entrar no Sistema
            </button>
          </form>
        )}

        {/* 2. MODO CADASTRO (REGISTRO) */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="label">Nome completo</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  className="input !pl-9"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="label">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  className="input !pl-9"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Senha (mín. 6 caracteres)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  className="input !pl-9"
                  placeholder="Crie uma senha segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-role" className="label">Papel de Acesso (Perfil)</label>
              <select
                id="reg-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="SOLICITANTE">Solicitante (Cria pautas e aprova posts)</option>
                <option value="EDITOR">Editor (Produz, ajusta e agenda posts)</option>
                <option value="DEVOPS">DevOps (Monitora N8N, webhooks e APIs)</option>
              </select>
            </div>

            <button id="register-submit" type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Cadastrar e Receber Código
            </button>
          </form>
        )}

        {/* 3. MODO VERIFICAÇÃO DE E-MAIL */}
        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900 ring-1 ring-brand-100">
              Enviamos um código de <strong>6 dígitos</strong> para o endereço:
              <span className="block mt-1 font-bold text-brand-700 truncate">{email}</span>
              <span className="mt-1 block text-[11px] text-slate-500">Expira em 15 minutos.</span>
            </div>

            <div>
              <label htmlFor="verify-code" className="label">Código de 6 dígitos</label>
              <input
                id="verify-code"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="input text-center text-2xl font-mono tracking-widest font-extrabold uppercase"
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button id="verify-submit" type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
              Confirmar e Ativar Conta
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                className="text-slate-500 hover:text-slate-900"
                onClick={() => { setMode('login'); setError('') }}
              >
                Voltar ao login
              </button>
              <button
                type="button"
                className="flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
                disabled={busy}
                onClick={handleResend}
              >
                <RefreshCw size={12} /> Reenviar código
              </button>
            </div>
          </form>
        )}

        {/* Acesso rápido para testes de demonstração */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Acesso Rápido de Testes (Senha: 123456)
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={() => fillQuickUser('solicitante@fabrica.com', 'Solicitante')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition"
            >
              Solicitante
            </button>
            <button
              type="button"
              onClick={() => fillQuickUser('editor@fabrica.com', 'Editor')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition"
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => fillQuickUser('devops@fabrica.com', 'DevOps')}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition"
            >
              DevOps
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
