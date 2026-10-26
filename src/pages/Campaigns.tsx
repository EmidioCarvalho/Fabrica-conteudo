import { useStore } from '../store/useStore'
import { PageHeader, Skeleton } from '../components/ui'
import { CAMPAIGNS } from '../services/mockData'
import { STATUS_META } from '../lib/meta'
import type { PostStatus } from '../types'

export default function Campaigns() {
  const { posts, loading, openRequest } = useStore()
  return (
    <div>
      <PageHeader title="Campanhas" subtitle="Progresso editorial agrupado por campanha">
        <button className="btn-primary" onClick={openRequest}>+ Nova solicitação</button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />) : CAMPAIGNS.map((c) => {
          const items = posts.filter((p) => p.campaign === c)
          const counts = items.reduce<Partial<Record<PostStatus, number>>>((a, p) => ({ ...a, [p.status]: (a[p.status] ?? 0) + 1 }), {})
          const done = items.filter((p) => p.status === 'Publicado').length
          const pct = items.length ? Math.round((done / items.length) * 100) : 0
          return (
            <article key={c} className="card animate-in p-5">
              <div className="flex items-start justify-between">
                <h2 className="font-bold text-ink-900">{c}</h2>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{items.length} posts</span>
              </div>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
                {(Object.keys(counts) as PostStatus[]).map((s) => (
                  <div key={s} title={`${s}: ${counts[s]}`} style={{ width: `${(counts[s]! / items.length) * 100}%`, background: STATUS_META[s].bar }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">{pct}% publicado</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {(Object.keys(counts) as PostStatus[]).map((s) => (
                  <li key={s} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[s].badge}`}>{counts[s]} {s}</li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </div>
  )
}
