import { useMemo, useState } from 'react'
import { Clock, Eye, Hourglass, Inbox, MessageSquareWarning, PenLine } from 'lucide-react'
import { useStore } from '../store/useStore'
import { NetBadge, PageHeader, Skeleton, StatusBadge, Thumb } from '../components/ui'
import { fmtDate } from '../lib/meta'
import { latestFeedback } from '../lib/posts'

type Tab = 'drafts' | 'in_review' | 'all'

export default function Drafts() {
  const { user, posts, loading, openEditor, setPage } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('drafts')

  const myPosts = useMemo(
    () => posts.filter((p) => p.editorId === user?.id),
    [posts, user],
  )

  const draftsAndAdjusts = useMemo(
    () => myPosts.filter((p) => p.status === 'Rascunho' || p.status === 'Ajustes solicitados' || p.status === 'AJUSTES_SOLICITADOS'),
    [myPosts],
  )

  const inReviewPosts = useMemo(
    () => myPosts.filter((p) => p.status === 'Em revisão' || p.status === 'EM_REVISAO'),
    [myPosts],
  )

  const displayedPosts = useMemo(() => {
    if (activeTab === 'drafts') return draftsAndAdjusts
    if (activeTab === 'in_review') return inReviewPosts
    return myPosts
  }, [activeTab, draftsAndAdjusts, inReviewPosts, myPosts])

  return (
    <div>
      <PageHeader title="Produção Editorial" subtitle="Acompanhe seus rascunhos, pedidos de ajustes e posts submetidos para revisão">
        <button className="btn-primary" onClick={() => setPage('queue')}><Inbox size={16} /> Assumir nova solicitação</button>
      </PageHeader>

      {/* Abas de Navegação */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('drafts')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'drafts'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200'
          }`}
        >
          <PenLine size={14} />
          Rascunhos & Ajustes
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeTab === 'drafts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {draftsAndAdjusts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('in_review')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'in_review'
              ? 'bg-yellow-500 text-white shadow-sm shadow-yellow-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200'
          }`}
        >
          <Hourglass size={14} />
          Enviados para Revisão
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeTab === 'in_review' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-800'}`}>
            {inReviewPosts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200'
          }`}
        >
          Todos os Meus Posts
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {myPosts.length}
          </span>
        </button>
      </div>

      {/* Grid de Posts */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)
        ) : displayedPosts.map((p) => {
          const fb = latestFeedback(p)
          const isReview = p.status === 'Em revisão' || p.status === 'EM_REVISAO'

          return (
            <article key={p.id} className="card animate-in overflow-hidden flex flex-col">
              <Thumb src={p.imageUrl} className="h-32 w-full" />
              <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StatusBadge status={p.status} />
                    <NetBadge net={p.socialNetwork} label={false} />
                  </div>
                  <h2 className="font-bold text-ink-900 leading-snug line-clamp-2">{p.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} />
                    {fmtDate(p.scheduledDate)} às {p.scheduledTime || '10:00'}
                  </p>
                </div>

                {isReview && (
                  <div className="rounded-xl bg-yellow-50 p-2.5 text-xs text-yellow-800 ring-1 ring-yellow-200/60 flex items-center gap-2">
                    <Hourglass size={14} className="shrink-0 text-yellow-600 animate-pulse" />
                    <span>Aguardando análise e aprovação do Solicitante.</span>
                  </div>
                )}

                {fb && (
                  <p className="flex gap-1.5 rounded-xl bg-orange-50 p-2.5 text-xs text-orange-800 ring-1 ring-orange-200">
                    <MessageSquareWarning size={14} className="shrink-0 text-orange-600" />
                    <span>“{p.rejectionFeedback ?? fb.notes}”</span>
                  </p>
                )}

                <div className="pt-1">
                  <button
                    id={`edit-${p.id}`}
                    className={`btn-sm w-full ${isReview ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => openEditor(p.id)}
                  >
                    {isReview ? <><Eye size={14} /> Ver Publicação</> : fb ? 'Corrigir Ajustes' : 'Continuar Editando'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {!loading && !displayedPosts.length && (
        <div className="card p-12 text-center text-sm text-slate-400">
          <p className="font-semibold text-slate-600">Nenhum post nesta aba no momento.</p>
          <p className="mt-1 text-xs">
            {activeTab === 'in_review'
              ? 'Quando você submeter um post para revisão, ele aparecerá aqui com o status atualizado!'
              : 'Seus novos posts e rascunhos aparecerão organizados nesta esteira.'}
          </p>
        </div>
      )}
    </div>
  )
}
