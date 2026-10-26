import { useState } from 'react'
import {
  BarChart3, CalendarDays, ClipboardList, FileEdit, Factory, Inbox, KanbanSquare, LayoutDashboard, LogOut, Megaphone,
  Menu, PlusCircle, Server, Settings, Terminal, Webhook, X, type LucideIcon,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { MENU, ROLE_LABEL, type MenuItem } from '../lib/rbac'

const ICONS: Record<MenuItem['id'], LucideIcon> = {
  dashboard: LayoutDashboard, queue: Inbox, drafts: FileEdit, requests: ClipboardList, newRequest: PlusCircle, calendar: CalendarDays,
  approval: KanbanSquare, metrics: BarChart3, campaigns: Megaphone,
  n8n: Webhook, system: Server, logs: Terminal, api: Settings,
}

const ROLE_BADGE = {
  EDITOR: 'bg-sky-100 text-sky-800',
  SOLICITANTE: 'bg-amber-100 text-amber-800',
  DEVOPS: 'bg-purple-100 text-purple-800',
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { user, page, setPage, openRequest, logout, resetDemo } = useStore()
  const [open, setOpen] = useState(false)
  if (!user) return null

  const nav = (
    <div className="flex h-full flex-col bg-ink-900 text-slate-300">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-lg"><Factory size={20} /></div>
        <div className="leading-tight">
          <p className="text-base font-extrabold text-white">Fábrica</p>
          <p className="text-xs font-medium text-slate-400">de Conteúdo</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {MENU[user.role].map(({ id, label }) => {
          const Icon = ICONS[id]
          return (
            <button
              key={id}
              id={`nav-${id}`}
              onClick={() => { id === 'newRequest' ? openRequest() : setPage(id); setOpen(false) }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${id === page ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={18} />{label}
            </button>
          )
        })}
      </nav>
      <div className="m-3 space-y-2 rounded-xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <button id="logout-side" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
          <LogOut size={15} /> Sair / Trocar de usuário
        </button>
        <button id="reset-demo" onClick={resetDemo} className="w-full text-left text-xs text-slate-500 hover:text-slate-300">↺ Restaurar dados de demonstração</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{nav}</aside>

      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <button id="menu-toggle" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <p id="logged-as" className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">Logado como:</span>
            <b className="truncate text-ink-900">{user.name}</b>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_BADGE[user.role]}`}>{ROLE_LABEL[user.role]}</span>
          </p>
          <button id="logout-top" onClick={logout} className="btn-ghost btn-sm shrink-0"><LogOut size={14} /> Sair</button>
        </header>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
            <div className="animate-in absolute inset-y-0 left-0 w-72">
              {nav}
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 text-white" aria-label="Fechar menu"><X /></button>
            </div>
          </div>
        )}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
