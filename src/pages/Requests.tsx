import { useMemo } from 'react'
import { CheckCircle2, Clock, Hourglass, MessageSquareWarning, Plus, Sparkles, XCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { DemandBadge, NetBadge, PageHeader, Skeleton } from '../components/ui'
import { ROUTE_LABEL, fmtDate } from '../lib/meta'
import { userName } from '../services/mockData'

/** Home do Solicitante: suas solicitações de pauta e o andamento de cada uma. */
export default function Requests() {
  const { user, demands, posts, loading, openRequest, cancelDemand, openEditor, setPage } = useStore()
  const mine = useMemo(
    () => demands.filter((d) => d.requestedBy === user?.id || d.requestedById === user?.id),
    [demands, user],
  )
  const toReview = posts.filter((p) => {
    const isRev = p.status === 'Em revisão' || p.status === 'EM_REVISAO'
    return isRev && mine.some((d) => d.id === p.demandId)
  })

  const cards = [
    { label: 'Aguardando Editor', value: mine.filter((d) => d.status === 'PENDENTE_EDITOR').length, icon: Hourglass, tint: 'bg-yellow-50 text-yellow-600' },
    { label: 'Em produção / revisão', value: mine.filter((d) => ['EM_PRODUCAO', 'EM_REVISAO', 'AJUSTES_SOLICITADOS'].includes(d.status)).length, icon: Sparkles, tint: 'bg-blue-50 text-blue-600' },
    { label: 'Enviadas à IA (N8N)', value: mine.filter((d) => d.status === 'ENVIADO_IA').length, icon: MessageSquareWarning, tint: 'bg-purple-50 text-purple-600' },
    { label: 'Concluídas', value: mine.filter((d) => d.status === 'CONCLUIDO').length, icon: CheckCircle2, tint: 'bg-green-50 text-green-600' },
  ]

  return (
    <div>
      <PageHeader title="Minhas Solicitações" subtitle={`Olá, ${user?.name.split(' ')[0]}! Acompanhe suas pautas e briefings.`}>
        <button id="req-new" className="btn-primary" onClick={openRequest}><Plus size={16} /> Nova solicitação</button>
      </PageHeader>

      {!loading && toReview.length > 0 && (
        <section id="review-alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-yellow-50 p-4 ring-1 ring-yellow-200" role="alert">
          <Hourglass className="shrink-0 text-yellow-600" size={20} />
          <p className="min-w-0 flex-1 text-sm font-semibold text-yellow-900">{toReview.length} publicação(ões) aguardando a sua revisão.</p>
          <button className="btn-primary btn-sm" onClick={() => setPage('approval')}>Ir para a Central de Aprovação</button>
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

      <section className="card mt-6 overflow-x-auto">
        <div className="p-5 pb-3"><h2 className="font-bold text-ink-900">Solicitações</h2></div>
        {loading ? <div className="p-5"><Skeleton className="h-32" /></div> : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-2">Pauta</th><th className="px-3 py-2">Rede</th><th className="px-3 py-2">Data desejada</th><th className="px-3 py-2">Destino</th><th className="px-3 py-2">Editor</th><th className="px-3 py-2">Status</th><th className="px-5 py-2" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mine.map((d) => {
                const post = posts.find((p) => p.demandId === d.id)
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="max-w-[280px] px-5 py-3"><p className="truncate font-medium text-ink-900">{d.title}</p><p className="truncate text-xs text-slate-500">{d.briefing}</p></td>
                    <td className="px-3 py-3"><NetBadge net={d.targetNetwork} /></td>
                    <td className="px-3 py-3 text-slate-600"><span className="flex items-center gap-1.5"><Clock size={12} />{fmtDate(d.desiredDate)}</span></td>
                    <td className="px-3 py-3 text-xs text-slate-600">{ROUTE_LABEL[d.routeTarget]}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{d.routeTarget === 'IA_N8N' ? userName('n8n') : userName(d.assignedEditorId)}</td>
                    <td className="px-3 py-3"><DemandBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {post && <button id={`req-view-${d.id}`} className="btn-ghost btn-sm" onClick={() => openEditor(post.id)}>Ver post</button>}
                      {d.status === 'PENDENTE_EDITOR' && <button id={`req-cancel-${d.id}`} className="btn-ghost btn-sm !text-red-600" onClick={() => cancelDemand(d.id)}><XCircle size={12} /> Cancelar</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && !mine.length && <p className="p-8 text-center text-sm text-slate-400">Você ainda não fez nenhuma solicitação.</p>}
      </section>
    </div>
  )
}
