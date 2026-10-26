import { useState } from 'react'
import { Check, Clock, Eye, History, Inbox, User, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { NetBadge, PageHeader, Skeleton, Thumb } from '../components/ui'
import { ReviewModals, type ReviewTarget } from '../components/ReviewModals'
import { STATUS_META, fmtDate } from '../lib/meta'
import { userName } from '../services/mockData'
import type { Post, PostStatus } from '../types'

const COLUMNS: PostStatus[] = ['Rascunho', 'Em revisão', 'Ajustes solicitados', 'Aprovado', 'Agendado', 'Publicado']

function Card({ post, onReview }: { post: Post; onReview?: (k: 'approve' | 'adjust') => void }) {
  const { showHistory, openEditor } = useStore()
  return (
    <article
      draggable={post.status === 'Em revisão'}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', post.id)}
      className={`card animate-in overflow-hidden ${post.status === 'Em revisão' ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <Thumb src={post.imageUrl} className="h-24 w-full" />
      <div className="space-y-2 p-3">
        <button onClick={() => openEditor(post.id)} className="text-left text-sm font-bold leading-snug text-ink-900 hover:text-brand-600">{post.title}</button>
        <NetBadge net={post.socialNetwork} />
        <div className="space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5"><Clock size={12} />{fmtDate(post.scheduledDate)} às {post.scheduledTime}</p>
          <p className="flex items-center gap-1.5"><User size={12} />{userName(post.editorId)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {onReview && (
            <>
              <button id={`approve-${post.id}`} className="btn-primary btn-sm" onClick={() => onReview('approve')}><Check size={12} />Aprovar</button>
              <button id={`adjust-${post.id}`} className="btn-ghost btn-sm" onClick={() => onReview('adjust')}><X size={12} />Ajustes</button>
            </>
          )}
          <button id={`preview-${post.id}`} className="btn-ghost btn-sm" onClick={() => openEditor(post.id)}><Eye size={12} />Ver</button>
          <button id={`history-${post.id}`} className="btn-ghost btn-sm" onClick={() => showHistory(post.id)}><History size={12} />Histórico</button>
        </div>
      </div>
    </article>
  )
}

const normalizeStatus = (status: string): PostStatus => {
  if (status === 'EM_REVISAO' || status === 'Em revisão') return 'Em revisão'
  if (status === 'AJUSTES_SOLICITADOS' || status === 'Ajustes solicitados') return 'Ajustes solicitados'
  if (status === 'APROVADO' || status === 'Aprovado') return 'Aprovado'
  if (status === 'AGENDADO' || status === 'Agendado') return 'Agendado'
  if (status === 'PUBLICADO' || status === 'Publicado') return 'Publicado'
  if (status === 'ERRO' || status === 'Erro') return 'Erro'
  if (status === 'RASCUNHO' || status === 'Rascunho') return 'Rascunho'
  return status as PostStatus
}

export default function ApprovalCenter() {
  const { user, posts: allPosts, demands, loading, toast } = useStore()

  // O Solicitante revisa posts das suas próprias solicitações (ou todas se for DevOps/Admin).
  const posts = allPosts.filter((p) => {
    const d = demands.find((dem) => dem.id === p.demandId)
    if (!d) return true
    return d.requestedBy === user?.id || d.requestedById === user?.id || user?.role === 'DEVOPS'
  })

  const [over, setOver] = useState<PostStatus | null>(null)
  const [target, setTarget] = useState<ReviewTarget>(null)

  // Lista todos os posts com status em revisão ou cuja pauta (demanda) pai esteja em 'EM_REVISAO'
  const queue = posts.filter((p) => {
    const d = demands.find((dem) => dem.id === p.demandId)
    return normalizeStatus(p.status) === 'Em revisão' || d?.status === 'EM_REVISAO'
  })
  const errors = posts.filter((p) => normalizeStatus(p.status) === 'Erro')

  // Arrastar um post em revisão: as decisões sempre passam pelos modais (confirmação ou comentário).
  const drop = (status: PostStatus, e: React.DragEvent) => {
    e.preventDefault()
    setOver(null)
    const post = posts.find((x) => x.id === e.dataTransfer.getData('text/plain'))
    if (!post || post.status === status) return
    if (status === 'Aprovado') setTarget({ post, kind: 'approve' })
    else if (status === 'Ajustes solicitados') setTarget({ post, kind: 'adjust' })
    else toast('Use "Aprovar" ou "Ajustes" para decidir sobre este post.', 'info')
  }

  return (
    <div>
      <PageHeader title="Central de Aprovação" subtitle="Revise os posts entregues pelos Editores: aprove ou solicite ajustes" />

      <section className="mb-8" aria-label="Fila de revisão">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink-900">
          <Inbox size={18} className="text-yellow-500" /> Fila de revisão
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">{queue.length}</span>
        </h2>
        {loading ? <Skeleton className="h-40" /> : queue.length === 0 ? (
          <p className="card p-8 text-center text-sm text-slate-400">Nada aguardando revisão. 🎉</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {queue.map((p) => (
              <div key={p.id} className="rounded-2xl ring-2 ring-yellow-300/70"><Card post={p} onReview={(kind) => setTarget({ post: p, kind })} /></div>
            ))}
          </div>
        )}
      </section>

      <h2 className="mb-3 font-bold text-ink-900">Fluxo editorial</h2>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <div className="flex gap-4">
          {COLUMNS.map((col) => {
            const items = posts.filter((p) => normalizeStatus(p.status) === col)
            return (
              <section
                key={col}
                onDragOver={(e) => { e.preventDefault(); setOver(col) }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => drop(col, e)}
                className={`w-72 shrink-0 rounded-2xl p-3 transition ${over === col ? 'bg-brand-50 ring-2 ring-brand-300' : 'bg-slate-100/70'}`}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900"><span className={`h-2 w-2 rounded-full ${STATUS_META[col].dot}`} />{col}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{items.length}</span>
                </header>
                <div className="space-y-3">
                  {loading ? <Skeleton className="h-40" /> : items.map((p) => (
                    <Card key={p.id} post={p} onReview={p.status === 'Em revisão' ? (kind) => setTarget({ post: p, kind }) : undefined} />
                  ))}
                  {!loading && !items.length && <p className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">Vazio</p>}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {errors.length > 0 && (
        <section className="mt-6 rounded-2xl border border-red-100 bg-red-50/50 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-red-700"><span className="h-2 w-2 rounded-full bg-red-500" />Erro ({errors.length})</h2>
          <p className="mb-3 text-xs text-red-600">O reprocessamento dos webhooks é feito pelo DevOps.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{errors.map((p) => <Card key={p.id} post={p} />)}</div>
        </section>
      )}

      <ReviewModals target={target} onClose={() => setTarget(null)} />
    </div>
  )
}
