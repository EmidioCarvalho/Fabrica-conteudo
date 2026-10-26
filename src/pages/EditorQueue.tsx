import { CalendarClock, Hand, Inbox, User } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store/useStore'
import { DemandBadge, NetBadge, PageHeader, Skeleton } from '../components/ui'
import { ROUTE_LABEL, fmtDate } from '../lib/meta'
import { userName } from '../services/mockData'

/** Fila de solicitações da Equipe de Marketing aguardando um Editor. */
export default function EditorQueue() {
  const { demands, loading, claimDemand } = useStore()
  const [busy, setBusy] = useState<string | null>(null)
  const queue = demands.filter((d) => d.status === 'PENDENTE_EDITOR' && d.routeTarget === 'EQUIPE_MARKETING')

  const claim = async (id: string) => { setBusy(id); await claimDemand(id); setBusy(null) }

  return (
    <div>
      <PageHeader title="Fila de Solicitações" subtitle="Pautas enviadas pelos Solicitantes. Assuma uma para começar a produzir o post." />
      <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-900">
        <Inbox size={18} className="text-yellow-500" /> Aguardando Editor
        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">{queue.length}</span>
      </h2>
      {loading ? <Skeleton className="h-40" /> : queue.length === 0 ? (
        <p className="card p-8 text-center text-sm text-slate-400">Nenhuma solicitação na fila. 🎉</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((d) => (
            <article key={d.id} className="card animate-in flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2"><DemandBadge status={d.status} /><NetBadge net={d.targetNetwork} /></div>
              <h3 className="font-bold leading-snug text-ink-900">{d.title}</h3>
              <p className="line-clamp-4 whitespace-pre-line text-sm text-slate-600">{d.briefing}</p>
              <div className="space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-1.5"><CalendarClock size={12} /> Desejada para {fmtDate(d.desiredDate)}</p>
                <p className="flex items-center gap-1.5"><User size={12} /> {userName(d.requestedBy)} · {ROUTE_LABEL[d.routeTarget]}</p>
              </div>
              <button id={`claim-${d.id}`} className="btn-primary mt-auto w-full" disabled={busy === d.id} onClick={() => claim(d.id)}>
                <Hand size={14} /> Assumir solicitação
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
