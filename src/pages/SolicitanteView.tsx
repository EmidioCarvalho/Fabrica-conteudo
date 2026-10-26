import { useState } from 'react'
import ApprovalCenter from './ApprovalCenter'
import Requests from './Requests'
import { PageHeader } from '../components/ui'
import { CheckSquare, ListPlus } from 'lucide-react'

/**
 * Visão consolidada do Solicitante:
 * Permite alternar facilmente entre o gerenciamento de solicitações e a Central de Aprovação.
 */
export default function SolicitanteView() {
  const [tab, setTab] = useState<'requests' | 'approval'>('approval')

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 pb-2 gap-2">
        <button
          type="button"
          onClick={() => setTab('approval')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'approval'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200'
          }`}
        >
          <CheckSquare size={14} />
          Central de Aprovação (Em Revisão)
        </button>

        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'requests'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200'
          }`}
        >
          <ListPlus size={14} />
          Minhas Solicitações de Pautas
        </button>
      </div>

      {tab === 'approval' ? <ApprovalCenter /> : <Requests />}
    </div>
  )
}
