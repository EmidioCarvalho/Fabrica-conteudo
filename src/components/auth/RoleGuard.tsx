import { ShieldAlert } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { HOME } from '../../lib/rbac'
import type { Role } from '../../types'

/** Renderização condicional por papel. Sem permissão, mostra `fallback` (ou nada). */
export function RoleGuard({ allow, children, fallback = null }: { allow: Role[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const user = useStore((s) => s.user)
  if (!user || !allow.includes(user.role)) return <>{fallback}</>
  return <>{children}</>
}

export function AccessDenied() {
  const { user, setPage } = useStore()
  return (
    <div className="card mx-auto mt-16 max-w-md p-8 text-center">
      <ShieldAlert className="mx-auto mb-3 text-red-500" size={36} />
      <h1 className="text-xl font-extrabold text-ink-900">Acesso negado</h1>
      <p className="mt-2 text-sm text-slate-500">Seu papel não tem permissão para abrir esta tela.</p>
      {user && <button className="btn-primary mt-5" onClick={() => setPage(HOME[user.role])}>Voltar ao início</button>}
    </div>
  )
}
