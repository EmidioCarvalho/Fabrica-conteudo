import { useState } from 'react'
import { Bot, Loader2, Users } from 'lucide-react'
import { Modal } from './ui'
import { FileUpload } from './FileUpload'
import { useStore } from '../store/useStore'
import { NETWORKS } from '../services/mockData'
import type { RouteTarget, SocialNetwork } from '../types'

const today = () => new Date().toISOString().slice(0, 10)

const ROUTES: { id: RouteTarget; icon: typeof Bot; title: string; desc: string }[] = [
  { id: 'EQUIPE_MARKETING', icon: Users, title: '👥 Equipe de Marketing', desc: 'Um Editor assume a pauta, produz o post e envia para a sua revisão.' },
  { id: 'IA_N8N', icon: Bot, title: '🤖 IA / Automação N8N', desc: 'O N8N gera, otimiza com IA e agenda a publicação automaticamente, sem passar por Editor.' },
]

/** Formulário de nova solicitação de pauta / briefing (Solicitante). */
export function RequestModal() {
  const { requestOpen, closeRequest, createDemand, user } = useStore()
  const [f, setF] = useState({
    title: '',
    briefing: '',
    targetNetwork: 'LinkedIn' as SocialNetwork,
    desiredDate: today(),
    routeTarget: 'EQUIPE_MARKETING' as RouteTarget,
    mediaUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  if (!requestOpen || user?.role !== 'SOLICITANTE') return null

  const submit = async () => {
    const er: Record<string, string> = {}
    if (!f.title.trim()) er.title = 'Informe o título da pauta'
    if (f.briefing.trim().length < 10) er.briefing = 'Descreva o briefing (mín. 10 caracteres)'
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    await createDemand({ ...f, title: f.title.trim(), briefing: f.briefing.trim() })
    setBusy(false)
    setF({ ...f, title: '', briefing: '' })
    closeRequest()
  }

  return (
    <Modal title="Nova solicitação de publicação" onClose={closeRequest} wide>
      <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="r-title">Título da pauta *</label>
          <input id="r-title" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Divulgar webinar de novembro" />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="r-briefing">Briefing *</label>
          <textarea id="r-briefing" rows={5} className="input resize-none" value={f.briefing} onChange={(e) => setF({ ...f, briefing: e.target.value })} placeholder="Objetivo, público, tom de voz, pontos obrigatórios, links…" />
          {errors.briefing && <p className="mt-1 text-xs text-red-600">{errors.briefing}</p>}
        </div>
        <div>
          <label className="label" htmlFor="r-net">Rede social</label>
          <select id="r-net" className="input" value={f.targetNetwork} onChange={(e) => setF({ ...f, targetNetwork: e.target.value as SocialNetwork })}>
            {NETWORKS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="r-date">Data desejada</label>
          <input id="r-date" type="date" className="input" value={f.desiredDate} onChange={(e) => setF({ ...f, desiredDate: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <FileUpload
            label="Mídia ou Referência Visual (opcional)"
            value={f.mediaUrl}
            onChange={(url) => setF({ ...f, mediaUrl: url })}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="label">Quem vai produzir?</p>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
            {ROUTES.map((o) => (
              <label key={o.id} className={`flex cursor-pointer gap-3 rounded-xl p-3 ring-1 transition ${f.routeTarget === o.id ? 'bg-brand-50 ring-2 ring-brand-500' : 'ring-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="route" id={`route-${o.id}`} className="mt-1 accent-brand-600" checked={f.routeTarget === o.id} onChange={() => setF({ ...f, routeTarget: o.id })} />
                <span><span className="block text-sm font-bold text-ink-900">{o.title}</span><span className="block text-xs text-slate-500">{o.desc}</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
          <button type="button" className="btn-ghost" onClick={closeRequest}>Cancelar</button>
          <button type="button" id="r-submit" className="btn-primary" disabled={busy} onClick={submit}>
            {busy && <Loader2 size={16} className="animate-spin" />} Enviar solicitação
          </button>
        </div>
      </form>
    </Modal>
  )
}
