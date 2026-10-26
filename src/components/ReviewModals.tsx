import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Modal } from './ui'
import { useStore } from '../store/useStore'
import type { Post } from '../types'

export type ReviewTarget = { post: Post; kind: 'approve' | 'adjust' } | null

/** Modais do Solicitante: aprovar a entrega ou solicitar ajustes ao Editor. */
export function ReviewModals({ target, onClose, onDone }: { target: ReviewTarget; onClose: () => void; onDone?: () => void }) {
  const { approvePost, moveStatus } = useStore()
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  if (!target) return null
  const { post, kind } = target

  const run = async () => {
    setBusy(true)
    if (kind === 'approve') await approvePost(post.id)
    else await moveStatus(post.id, 'Ajustes solicitados', notes.trim())
    setBusy(false)
    setNotes('')
    onClose()
    onDone?.()
  }

  return (
    <Modal title={kind === 'approve' ? 'Aprovar publicação' : 'Solicitar ajustes'} onClose={onClose}>
      <div className="space-y-4 p-5">
        {kind === 'approve' ? (
          <div className="flex gap-3 rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200">
            <CheckCircle2 className="mt-0.5 shrink-0 text-blue-500" size={18} />
            <p className="text-sm text-blue-900">
              Ao aprovar <b>{post.title}</b>, o status muda para <b>Aprovado</b> e o Editor responsável fica encarregado de publicá-lo.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600">Descreva o que o Editor precisa corrigir em <b>{post.title}</b>.</p>
            <textarea id="adjust-notes" rows={4} className="input resize-none" placeholder="Ex.: revisar o tom de voz e ajustar o CTA" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button id="confirm-review" className="btn-primary" disabled={busy || (kind === 'adjust' && !notes.trim())} onClick={run}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {kind === 'approve' ? 'Confirmar aprovação' : 'Enviar ajustes ao Editor'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
