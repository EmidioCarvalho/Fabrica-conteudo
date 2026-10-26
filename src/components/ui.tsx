import { useEffect } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { DemandStatus, PostStatus, SocialNetwork } from '../types'
import { DEMAND_META, NET_META, STATUS_META } from '../lib/meta'
import { useStore } from '../store/useStore'

export function StatusBadge({ status }: { status: PostStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  )
}

export function DemandBadge({ status }: { status: DemandStatus }) {
  const m = DEMAND_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

export function NetBadge({ net, label = true }: { net: SocialNetwork; label?: boolean }) {
  const { icon: Icon, color, bg } = NET_META[net]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${bg} ${color}`} title={net}>
      <Icon size={13} />
      {label && net}
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={`animate-in flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'max-w-4xl' : 'max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button id="modal-close" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  const icon = { success: <CheckCircle2 size={18} className="text-emerald-500" />, error: <XCircle size={18} className="text-red-500" />, info: <Info size={18} className="text-brand-500" /> }
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="animate-in pointer-events-auto flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-xl ring-1 ring-slate-200">
          {icon[t.type]}
          <p className="flex-1 text-sm font-medium text-slate-700">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar aviso"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}

export function Thumb({ src, className = '' }: { src?: string; className?: string }) {
  if (!src) return <div className={`bg-slate-100 ${className}`} />
  return <img src={src} alt="" className={`object-cover ${className}`} loading="lazy" />
}
