import { useState } from 'react'
import { Check, Globe, Heart, MessageCircle, MessageSquareWarning, Share2 } from 'lucide-react'
import { Modal, NetBadge, StatusBadge, Thumb } from './ui'
import { ReviewModals, type ReviewTarget } from './ReviewModals'
import { HistoryList } from './PostModal'
import { RoleGuard } from './auth/RoleGuard'
import { useStore } from '../store/useStore'
import { userName } from '../services/mockData'
import { ROUTE_LABEL, fmtDate } from '../lib/meta'
import { latestFeedback } from '../lib/posts'
import type { Post, Role } from '../types'

/** Mock de como o post ficará na rede social. */
export function SocialPreview({ post }: { post: Post }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-3 p-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-sm font-bold text-white">FC</div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-ink-900">Fábrica de Conteúdo</p>
          <p className="flex items-center gap-1 text-xs text-slate-500"><Globe size={11} /> {post.socialNetwork} · {fmtDate(post.scheduledDate)} {post.scheduledTime}</p>
        </div>
      </div>
      <div className="whitespace-pre-line px-3 pb-3 text-sm text-slate-700">{post.caption}</div>
      <Thumb src={post.imageUrl} className="aspect-[4/3] w-full" />
      <div className="space-y-2 p-3">
        {post.cta && <p className="inline-block rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">{post.cta}</p>}
        {post.hashtags && <p className="text-sm font-medium text-sky-600">{post.hashtags}</p>}
        <div className="flex gap-5 border-t border-slate-100 pt-2 text-slate-400"><Heart size={18} /><MessageCircle size={18} /><Share2 size={18} /></div>
      </div>
    </div>
  )
}

/** Visão detalhada para o Solicitante (com ações de decisão) e DevOps (somente leitura). */
export function PostPreviewModal({ post, role, onClose }: { post: Post; role: Role; onClose: () => void }) {
  const [target, setTarget] = useState<ReviewTarget>(null)
  const feedback = latestFeedback(post)
  const demand = useStore((s) => s.demands.find((d) => d.id === post.demandId))
  const canReview = role === 'SOLICITANTE' && post.status === 'Em revisão'

  return (
    <>
      <Modal title="Detalhes da publicação" onClose={onClose} wide>
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-ink-900">{post.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={post.status} /><NetBadge net={post.socialNetwork} /></div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[['Tema', post.theme], ['Campanha', post.campaign], ['Editor', userName(post.editorId)], ['Destino', demand ? ROUTE_LABEL[demand.routeTarget] : '—'], ['Agendamento', `${fmtDate(post.scheduledDate)} às ${post.scheduledTime}`]].map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold text-slate-500">{k}</dt><dd className="font-medium text-ink-900">{v}</dd></div>
              ))}
            </dl>
            {demand && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-100">
                <p className="text-xs font-semibold text-slate-500">Briefing da solicitação · {userName(demand.requestedBy)}</p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{demand.briefing}</p>
              </div>
            )}
            {feedback && (
              <div className="flex gap-2 rounded-xl bg-orange-50 p-3 text-sm text-orange-800 ring-1 ring-orange-200">
                <MessageSquareWarning size={16} className="mt-0.5 shrink-0" /> <span><b>{feedback.changedBy}:</b> {feedback.notes}</span>
              </div>
            )}
            <div>
              <p className="label">Histórico</p>
              <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><HistoryList history={post.history} /></div>
            </div>
          </div>
          <div>
            <p className="label">Preview na rede social</p>
            <SocialPreview post={post} />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 p-4">
          <button className="btn-ghost" id="preview-close" onClick={onClose}>Fechar</button>
          <RoleGuard allow={['SOLICITANTE']}>
            {canReview && (
              <>
                <button id="preview-adjust" className="btn-ghost !text-orange-700" onClick={() => setTarget({ post, kind: 'adjust' })}>❌ Solicitar Ajustes</button>
                <button id="preview-approve" className="btn-primary" onClick={() => setTarget({ post, kind: 'approve' })}><Check size={16} /> ✅ Aprovar Publicação</button>
              </>
            )}
          </RoleGuard>
        </div>
      </Modal>
      <ReviewModals target={target} onClose={() => setTarget(null)} onDone={onClose} />
    </>
  )
}
