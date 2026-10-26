import { useMemo, useState } from 'react'
import { AlertTriangle, FileEdit, Hourglass, Inbox, MessageSquareWarning, Send } from 'lucide-react'
import { useStore } from '../store/useStore'
import { NetBadge, PageHeader, Skeleton, StatusBadge } from '../components/ui'
import { fmtDate } from '../lib/meta'
import { latestFeedback } from '../lib/posts'

export default function EditorDashboard() {
  const { user, posts, demands, loading, openEditor, moveStatus, setPage } = useStore()
  const [busy, setBusy] = useState<string | null>(null)
  const mine = useMemo(() => posts.filter((p) => p.editorId === user?.id), [posts, user])
  const adjusts = mine.filter((p) => p.status === 'Ajustes solicitados')
  const manual = posts.filter((p) => p.status === 'Aprovado')

  const pending = demands.filter((d) => d.status === 'PENDENTE_EDITOR' && d.routeTarget === 'EQUIPE_MARKETING').length

  const cards = [
    { label: 'Solicitações na Fila', value: pending, icon: Inbox, tint: 'bg-brand-50 text-brand-600' },
    { label: 'Rascunhos em Aberto', value: mine.filter((p) => p.status === 'Rascunho').length, icon: FileEdit, tint: 'bg-slate-100 text-slate-600' },
    { label: 'Aguardando Revisão', value: mine.filter((p) => p.status === 'Em revisão').length, icon: Hourglass, tint: 'bg-yellow-50 text-yellow-600' },
    { label: 'Ajustes Solicitados', value: adjusts.length, icon: MessageSquareWarning, tint: 'bg-orange-50 text-orange-600' },
  ]

  const publish = async (id: string) => { setBusy(id); await moveStatus(id, 'Publicado', 'Publicação manual concluída.'); setBusy(null) }

  return (
    <div>
      <PageHeader title="Dashboard do Editor" subtitle={`Olá, ${user?.name.split(' ')[0]}! Veja o que precisa da sua atenção.`}>
        <button id="dash-queue" className="btn-primary" onClick={() => setPage('queue')}><Inbox size={16} /> Ver fila de solicitações</button>
      </PageHeader>

      {!loading && adjusts.length > 0 && (
        <section id="adjust-alerts" className="mb-6 space-y-3" aria-label="Ajustes solicitados">
          {adjusts.map((p) => {
            const fb = latestFeedback(p)
            return (
              <div key={p.id} role="alert" className="animate-in flex flex-wrap items-start gap-3 rounded-2xl bg-orange-50 p-4 ring-1 ring-orange-200">
                <AlertTriangle className="mt-0.5 shrink-0 text-orange-500" size={20} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-orange-900">Ajustes solicitados em “{p.title}”</p>
                  <p className="mt-0.5 text-sm text-orange-800"><b>{fb?.changedBy}:</b> “{p.rejectionFeedback ?? fb?.notes ?? 'Sem comentários.'}”</p>
                </div>
                <button id={`fix-${p.id}`} className="btn-primary btn-sm" onClick={() => openEditor(p.id)}>Corrigir agora</button>
              </div>
            )
          })}
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="card animate-in p-5">
            {loading ? <Skeleton className="h-16" /> : (
              <div className="flex items-center gap-4">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}><Icon size={20} /></div>
                <div><p className="text-3xl font-extrabold text-ink-900">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-bold text-ink-900">Publicações manuais pendentes</h2>
        <p className="mb-3 text-xs text-slate-500">Posts aprovados pelo Solicitante, aguardando publicação manual</p>
        {loading ? <Skeleton className="h-20" /> : manual.length === 0 ? <p className="text-sm text-slate-400">Nenhuma tarefa pendente.</p> : (
          <ul className="divide-y divide-slate-100">
            {manual.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{p.title}</p>
                  <p className="text-xs text-slate-500">{fmtDate(p.scheduledDate)} às {p.scheduledTime}</p>
                </div>
                <NetBadge net={p.socialNetwork} />
                <button id={`publish-${p.id}`} className="btn-ghost btn-sm" disabled={busy === p.id} onClick={() => publish(p.id)}><Send size={12} /> Marcar como publicado</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-6 overflow-x-auto">
        <div className="p-5 pb-3"><h2 className="font-bold text-ink-900">Meus posts recentes</h2></div>
        <table className="w-full min-w-[480px] text-left text-sm">
          <tbody className="divide-y divide-slate-100">
            {mine.slice(0, 6).map((p) => (
              <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openEditor(p.id)}>
                <td className="max-w-[260px] truncate px-5 py-3 font-medium text-ink-900">{p.title}</td>
                <td className="px-3 py-3"><NetBadge net={p.socialNetwork} /></td>
                <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
