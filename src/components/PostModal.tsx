import { useMemo, useState } from 'react'
import { ArrowRight, ImagePlus, Loader2, MessageSquareWarning, Send } from 'lucide-react'
import { Modal, StatusBadge } from './ui'
import { FileUpload } from './FileUpload'
import { PostPreviewModal } from './PostPreview'
import { useStore } from '../store/useStore'
import * as api from '../services/api'
import { CAMPAIGNS, NETWORKS, makeThumb } from '../services/mockData'
import { ROUTE_LABEL, fmtDateTime } from '../lib/meta'
import { isEditable, latestFeedback } from '../lib/posts'
import type { Post, SocialNetwork, PostStatus, StatusHistory } from '../types'

const LIMITS: Record<SocialNetwork, number> = {
  LinkedIn: 3000, Instagram: 2200, Facebook: 5000, 'X/Twitter': 280, Threads: 500, 'YouTube Shorts': 100,
}

type Form = Omit<Post, 'id' | 'history' | 'updatedAt' | 'metrics'>

export function HistoryList({ history }: { history: StatusHistory[] }) {
  const items = [...history].reverse()
  return (
    <ol className="space-y-3">
      {items.map((h) => (
        <li key={h.id} className="flex gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0 text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {h.statusFrom && h.statusFrom !== h.statusTo ? (
                <>
                  <StatusBadge status={h.statusFrom} /><ArrowRight size={12} className="text-slate-400" />
                </>
              ) : null}
              <StatusBadge status={h.statusTo} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{h.changedBy}</span> · {fmtDateTime(h.timestamp)}
            </p>
            {h.notes && <p className="mt-0.5 text-xs italic text-slate-500">“{h.notes}”</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function HistoryModal() {
  const { historyPostId, showHistory, posts } = useStore()
  const post = posts.find((p) => p.id === historyPostId)
  if (!post) return null
  return (
    <Modal title="Histórico de alterações" onClose={() => showHistory(null)}>
      <div className="p-5">
        <p className="mb-4 text-sm font-semibold text-slate-700">{post.title}</p>
        <HistoryList history={post.history} />
      </div>
    </Modal>
  )
}

export function PostModal() {
  const { editor, closeEditor, posts, savePost, user } = useStore()
  const existing = useMemo(() => posts.find((p) => p.id === editor.postId), [posts, editor.postId])
  if (!editor.open || !user) return null
  if (!existing) return null
  // Editor tem o formulário completo; Solicitante e DevOps veem apenas o preview detalhado.
  if (user.role !== 'EDITOR') return <PostPreviewModal post={existing} role={user.role} onClose={closeEditor} />
  return <PostForm key={existing.id} existing={existing} onClose={closeEditor} save={savePost} />
}

function PostForm({ existing, onClose, save }: {
  existing: Post; onClose: () => void
  save: (d: Form, id: string) => Promise<void>
}) {
  const demand = useStore((s) => s.demands.find((d) => d.id === existing.demandId))
  const [f, setF] = useState<Form>(() => {
    const { id: _i, history: _h, updatedAt: _u, metrics: _m, ...rest } = existing
    return rest
  })
  const [saving, setSaving] = useState<'draft' | 'review' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }))
  const limit = LIMITS[f.socialNetwork]
  const over = f.caption.length > limit
  const editable = isEditable(existing)
  const feedback = latestFeedback(existing)

  const submit = async (mode: 'draft' | 'review') => {
    const er: Record<string, string> = {}
    if (!f.title.trim()) er.title = 'Informe o título'
    if (!f.caption.trim()) er.caption = 'Informe a legenda'
    if (over) er.caption = `Excede o limite de ${limit} caracteres do ${f.socialNetwork}`
    setErrors(er)
    if (Object.keys(er).length) return
    setSaving(mode)
    const status: PostStatus = mode === 'review' ? 'Em revisão' : existing.status
    await save({ ...f, status, imageUrl: f.imageUrl || makeThumb(Math.floor(Math.random() * 6), f.theme || f.title) }, existing.id)
    setSaving(null)
    onClose()
  }

  const fakeUpload = () => set('imageUrl', makeThumb(Math.floor(Math.random() * 6), f.theme || f.title || 'Imagem'))

  return (
    <Modal title={editable ? 'Editar publicação' : 'Publicação (somente leitura)'} onClose={onClose} wide>
      <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 p-5 lg:grid-cols-[1fr_260px]">
        {demand && (
          <div id="demand-brief" className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Briefing da solicitação · {ROUTE_LABEL[demand.routeTarget]}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{demand.briefing}</p>
          </div>
        )}
        {feedback && (
          <div role="alert" id="feedback-banner" className="flex gap-3 rounded-xl bg-orange-50 p-4 ring-1 ring-orange-200 lg:col-span-2">
            <MessageSquareWarning className="mt-0.5 shrink-0 text-orange-500" size={18} />
            <div className="text-sm">
              <p className="font-bold text-orange-800">Ajustes solicitados por {feedback.changedBy}</p>
              <p className="mt-0.5 text-orange-700">“{feedback.notes ?? 'Sem comentários.'}”</p>
            </div>
          </div>
        )}
        <fieldset disabled={!editable} className="contents">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="f-title">Título *</label>
            <input id="f-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex.: 5 tendências de IA" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="label" htmlFor="f-theme">Tema</label>
            <input id="f-theme" className="input" value={f.theme} onChange={(e) => set('theme', e.target.value)} placeholder="Ex.: Inteligência Artificial" />
          </div>
          <div>
            <label className="label" htmlFor="f-net">Rede social</label>
            <select id="f-net" className="input" value={f.socialNetwork} onChange={(e) => set('socialNetwork', e.target.value as SocialNetwork)}>
              {NETWORKS.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="f-caption">Legenda *</label>
              <span className={`text-xs font-medium ${over ? 'text-red-600' : 'text-slate-400'}`}>{f.caption.length}/{limit}</span>
            </div>
            <textarea id="f-caption" rows={5} className="input resize-none" value={f.caption} onChange={(e) => set('caption', e.target.value)} />
            {errors.caption && <p className="mt-1 text-xs text-red-600">{errors.caption}</p>}
          </div>
          <div>
            <label className="label" htmlFor="f-cta">CTA (Call to Action)</label>
            <input id="f-cta" className="input" value={f.cta} onChange={(e) => set('cta', e.target.value)} placeholder="Ex.: Inscreva-se agora" />
          </div>
          <div>
            <label className="label" htmlFor="f-tags">Hashtags</label>
            <input id="f-tags" className="input" value={f.hashtags} onChange={(e) => set('hashtags', e.target.value)} placeholder="#marketing #ia" />
          </div>
          <div>
            <label className="label" htmlFor="f-date">Data de agendamento</label>
            <input id="f-date" type="date" className="input" value={f.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="f-time">Horário</label>
            <input id="f-time" type="time" className="input" value={f.scheduledTime} onChange={(e) => set('scheduledTime', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="f-camp">Campanha</label>
            <select id="f-camp" className="input" value={f.campaign} onChange={(e) => set('campaign', e.target.value)}>
              {CAMPAIGNS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <p className="label">Status</p>
            <StatusBadge status={existing.status} />
          </div>
        </div>

        <div className="space-y-4">
          <FileUpload
            label="Briefing visual / imagem da publicação"
            value={f.imageUrl}
            onChange={(url) => set('imageUrl', url)}
            postId={existing.id}
          />
          <button
            type="button"
            id="f-upload"
            onClick={fakeUpload}
            className="btn-ghost btn-sm w-full text-xs"
          >
            <ImagePlus size={14} /> Gerar thumbnail demonstrativo
          </button>
          <div>
            <p className="label">Histórico de alterações</p>
            <div className="max-h-52 overflow-y-auto rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <HistoryList history={existing.history} />
            </div>
          </div>
        </div>

        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 lg:col-span-2">
          <p className="text-xs text-slate-400">{editable ? 'Rascunho → Em revisão ao enviar' : 'Este post não está mais em edição'}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" id="f-cancel" onClick={onClose} className="btn-ghost">{editable ? 'Cancelar' : 'Fechar'}</button>
            {editable && (
              <>
                <button type="button" id="f-save" disabled={saving !== null} onClick={() => submit('draft')} className="btn-ghost">
                  {saving === 'draft' && <Loader2 size={16} className="animate-spin" />} Salvar rascunho
                </button>
                <button type="button" id="f-review" disabled={saving !== null} onClick={() => submit('review')} className="btn-primary">
                  {saving === 'review' ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                  {existing.status === 'Ajustes solicitados' ? 'Reenviar para Revisão' : 'Enviar para Revisão'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}
