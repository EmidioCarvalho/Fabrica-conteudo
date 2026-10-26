import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store/useStore'
import { NetBadge, PageHeader, Skeleton } from '../components/ui'
import { fmtNum } from '../lib/meta'
import { NETWORKS } from '../services/mockData'

export default function Metrics() {
  const { posts, loading } = useStore()
  const measured = useMemo(() => posts.filter((p) => p.metrics), [posts])

  const total = useMemo(() => {
    const t = { reach: 0, impressions: 0, clicks: 0, conversions: 0, eng: 0 }
    measured.forEach((p) => { t.reach += p.metrics!.reach; t.impressions += p.metrics!.impressions; t.clicks += p.metrics!.clicks; t.conversions += p.metrics!.conversions; t.eng += p.metrics!.engagementRate })
    return { ...t, eng: measured.length ? +(t.eng / measured.length).toFixed(1) : 0 }
  }, [measured])

  const byNet = NETWORKS.map((n) => {
    const ps = measured.filter((p) => p.socialNetwork === n)
    return { net: n, Alcance: ps.reduce((a, p) => a + p.metrics!.reach, 0), Cliques: ps.reduce((a, p) => a + p.metrics!.clicks, 0) }
  }).filter((d) => d.Alcance || d.Cliques)

  const cards = [
    ['Alcance', fmtNum(total.reach)], ['Impressões', fmtNum(total.impressions)], ['Cliques', fmtNum(total.clicks)],
    ['Engajamento médio', `${total.eng}%`], ['Conversões', fmtNum(total.conversions)],
  ]

  return (
    <div>
      <PageHeader title="Métricas" subtitle="Desempenho dos conteúdos mensurados" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map(([l, v]) => (
          <div key={l} className="card p-4">
            {loading ? <Skeleton className="h-12" /> : <><p className="text-xs font-medium text-slate-500">{l}</p><p className="mt-1 text-2xl font-extrabold text-ink-900">{v}</p></>}
          </div>
        ))}
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-bold text-ink-900">Alcance e cliques por rede</h2>
        <div className="mt-4 h-64">
          {loading ? <Skeleton className="h-full" /> : (
            <ResponsiveContainer>
              <BarChart data={byNet}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="net" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }} />
                <Bar dataKey="Alcance" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Cliques" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{['Post', 'Rede', 'Alcance', 'Curtidas', 'Coment.', 'Compart.', 'Salvos', 'Eng.'].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {measured.map((p) => (
              <tr key={p.id}>
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-ink-900">{p.title}</td>
                <td className="px-4 py-3"><NetBadge net={p.socialNetwork} /></td>
                <td className="px-4 py-3">{fmtNum(p.metrics!.reach)}</td><td className="px-4 py-3">{fmtNum(p.metrics!.likes)}</td>
                <td className="px-4 py-3">{fmtNum(p.metrics!.comments)}</td><td className="px-4 py-3">{fmtNum(p.metrics!.shares)}</td>
                <td className="px-4 py-3">{fmtNum(p.metrics!.saves)}</td><td className="px-4 py-3 font-semibold text-emerald-600">{p.metrics!.engagementRate}%</td>
              </tr>
            ))}
            {!loading && !measured.length && <tr><td colSpan={8} className="p-6 text-center text-slate-400">Nenhum post mensurado ainda.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
