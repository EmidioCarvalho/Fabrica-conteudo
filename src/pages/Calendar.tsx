import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { NetBadge, PageHeader, Skeleton } from '../components/ui'
import { CAMPAIGNS, NETWORKS } from '../services/mockData'
import { NET_META, STATUS_META } from '../lib/meta'
import type { Post } from '../types'

const WD = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function Chip({ post, onClick }: { post: Post; onClick: () => void }) {
  const { icon: Icon, color } = NET_META[post.socialNetwork]
  return (
    <button
      onClick={onClick}
      title={`${post.title} · ${post.status}`}
      className="flex w-full items-center gap-1 truncate rounded-md bg-white px-1.5 py-1 text-left text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 transition hover:ring-brand-400"
    >
      <span className={`h-full w-0.5 self-stretch rounded ${STATUS_META[post.status].dot}`} />
      <Icon size={11} className={`shrink-0 ${color}`} />
      <span className="shrink-0 text-slate-400">{post.scheduledTime}</span>
      <span className="truncate">{post.title}</span>
    </button>
  )
}

export default function Calendar() {
  const { posts, loading, openEditor } = useStore()
  const [mode, setMode] = useState<'month' | 'week'>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [net, setNet] = useState('')
  const [camp, setCamp] = useState('')

  const filtered = useMemo(
    () => posts.filter((p) => (!net || p.socialNetwork === net) && (!camp || p.campaign === camp)
      && ['Agendado', 'Publicado', 'Aprovado', 'Erro'].includes(p.status)),
    [posts, net, camp],
  )

  const days = useMemo(() => {
    const out: Date[] = []
    if (mode === 'month') {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      const start = new Date(first)
      start.setDate(1 - ((first.getDay() + 6) % 7))
      for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); out.push(d) }
    } else {
      const start = new Date(cursor)
      start.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
      for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); out.push(d) }
    }
    return out
  }, [cursor, mode])

  const shift = (n: number) => {
    const d = new Date(cursor)
    if (mode === 'month') d.setMonth(d.getMonth() + n)
    else d.setDate(d.getDate() + n * 7)
    setCursor(d)
  }

  const title = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const todayKey = key(new Date())

  return (
    <div>
      <PageHeader title="Calendário Editorial" subtitle="Posts aprovados, agendados e publicados">
        <select id="cal-net" className="input !w-auto" value={net} onChange={(e) => setNet(e.target.value)}>
          <option value="">Todas as redes</option>{NETWORKS.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select id="cal-camp" className="input !w-auto" value={camp} onChange={(e) => setCamp(e.target.value)}>
          <option value="">Todas as campanhas</option>{CAMPAIGNS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </PageHeader>

      <div className="card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button id="cal-prev" className="btn-ghost btn-sm" onClick={() => shift(-1)} aria-label="Anterior"><ChevronLeft size={16} /></button>
            <h2 className="min-w-[10rem] text-center font-bold capitalize text-ink-900">{title}</h2>
            <button id="cal-next" className="btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Próximo"><ChevronRight size={16} /></button>
            <button className="btn-ghost btn-sm" onClick={() => setCursor(new Date())}>Hoje</button>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {(['month', 'week'] as const).map((m) => (
              <button key={m} id={`cal-${m}`} onClick={() => setMode(m)} className={`rounded-md px-3 py-1 text-xs font-semibold ${mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>
                {m === 'month' ? 'Mês' : 'Semana'}
              </button>
            ))}
          </div>
        </div>

        {loading ? <Skeleton className="h-96" /> : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold uppercase text-slate-400">
                {WD.map((d) => <div key={d} className="pb-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200">
                {days.map((d) => {
                  const items = filtered.filter((p) => p.scheduledDate === key(d)).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                  const muted = mode === 'month' && d.getMonth() !== cursor.getMonth()
                  const isToday = key(d) === todayKey
                  return (
                    <div key={key(d)} className={`${mode === 'week' ? 'min-h-[320px]' : 'min-h-[104px]'} space-y-1 p-1.5 ${muted ? 'bg-slate-50' : 'bg-white'}`}>
                      <span className={`mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${isToday ? 'bg-brand-600 text-white' : muted ? 'text-slate-300' : 'text-slate-600'}`}>{d.getDate()}</span>
                      {items.slice(0, mode === 'week' ? 20 : 3).map((p) => <Chip key={p.id} post={p} onClick={() => openEditor(p.id)} />)}
                      {mode === 'month' && items.length > 3 && <p className="px-1 text-[10px] font-semibold text-brand-600">+{items.length - 3} mais</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {(['Aprovado', 'Agendado', 'Publicado', 'Erro'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />{s}</span>
          ))}
          <span className="ml-auto hidden items-center gap-1 sm:flex">{NETWORKS.map((n) => <NetBadge key={n} net={n} label={false} />)}</span>
        </div>
      </div>
    </div>
  )
}
