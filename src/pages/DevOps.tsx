import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { CheckCircle2, Eye, EyeOff, Inbox, Loader2, RefreshCw, Save, Webhook, XCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Modal, PageHeader, Skeleton } from '../components/ui'
import { fmtDateTime } from '../lib/meta'
import { NETWORKS } from '../services/mockData'
import type { N8nLog } from '../types'

const BADGE = { Success: 'bg-green-50 text-green-700', Pending: 'bg-yellow-50 text-yellow-800', Failed: 'bg-red-50 text-red-700' }

const endpointOf = (l: N8nLog) => ((l.payload.request as { endpoint?: string } | undefined)?.endpoint ?? 'POST /webhook/publish')
const statusCodeOf = (l: N8nLog) => (l.payload.response as { status?: number } | undefined)?.status ?? '—'

function RetryButton({ log }: { log: N8nLog }) {
  const { retryLog } = useStore()
  const [busy, setBusy] = useState(false)
  if (log.status !== 'Failed') return null
  return (
    <button id={`retry-${log.id}`} className="btn-primary btn-sm" disabled={busy} onClick={async () => { setBusy(true); await retryLog(log.id); setBusy(false) }}>
      {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Reprocessar Webhook (Retry)
    </button>
  )
}

export function PayloadModal({ log, onClose }: { log: N8nLog; onClose: () => void }) {
  return (
    <Modal title={`Payload · ${log.id}`} onClose={onClose} wide>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-0.5 font-bold ${BADGE[log.status]}`}>{log.status}</span>
          <code className="rounded bg-slate-100 px-2 py-0.5 font-semibold">{endpointOf(log)}</code>
          <span className="text-slate-400">{fmtDateTime(log.timestamp)}</span>
        </div>
        <pre id="payload-json" className="max-h-[55vh] overflow-auto rounded-xl bg-ink-900 p-4 text-xs leading-relaxed text-emerald-300">{JSON.stringify(log.payload, null, 2)}</pre>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(JSON.stringify(log.payload, null, 2))}>Copiar JSON</button>
          <button className="btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </Modal>
  )
}

/** Painel N8N & Webhooks: métricas de infraestrutura. */
export function N8nPanel() {
  const { logs, loading, setPage } = useStore()
  const ok = logs.filter((l) => l.status === 'Success').length
  const failed = logs.filter((l) => l.status === 'Failed').length
  const rate = logs.length ? Math.round((ok / logs.length) * 100) : 100
  const [inspect, setInspect] = useState<N8nLog | null>(null)
  const data = [{ name: 'Sucesso', value: ok, color: '#22c55e' }, { name: 'Erros de integração', value: failed, color: '#ef4444' }]
  const cards = [
    { label: 'Requisições recebidas', value: logs.length, icon: Inbox, tint: 'bg-blue-50 text-blue-600' },
    { label: 'Publicados via N8N (sucesso)', value: ok, icon: CheckCircle2, tint: 'bg-green-50 text-green-600' },
    { label: 'Erros de integração', value: failed, icon: XCircle, tint: 'bg-red-50 text-red-600' },
    { label: 'Taxa de sucesso', value: `${rate}%`, icon: Webhook, tint: 'bg-purple-50 text-purple-600' },
  ]
  return (
    <div>
      <PageHeader title="Painel N8N & Webhooks" subtitle="Infraestrutura da automação e integrações">
        <button className="btn-ghost" onClick={() => setPage('logs')}>Ver logs de execução</button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="card p-4">
            {loading ? <Skeleton className="h-16" /> : (
              <><div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${tint}`}><Icon size={18} /></div>
                <p className="text-3xl font-extrabold text-ink-900">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-bold text-ink-900">Sucesso vs. Erros</h2>
          <div className="h-60">
            {loading ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>{data.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section className="card p-5 lg:col-span-3">
          <h2 className="font-bold text-ink-900">Webhooks recentes</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {logs.slice(0, 5).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${BADGE[l.status]}`}>{l.status}</span>
                <code className="text-xs font-semibold text-slate-600">{endpointOf(l)}</code>
                <span className="ml-auto text-xs text-slate-400">{fmtDateTime(l.timestamp)}</span>
                <button className="btn-ghost btn-sm" onClick={() => setInspect(l)}>Payload</button>
                <RetryButton log={l} />
              </li>
            ))}
          </ul>
        </section>
      </div>
      {inspect && <PayloadModal log={inspect} onClose={() => setInspect(null)} />}
    </div>
  )
}

/** Logs de Execução: tabela com inspeção de payload e retry. */
export function ExecutionLogs() {
  const { logs, posts, loading } = useStore()
  const [filter, setFilter] = useState<'ALL' | N8nLog['status']>('ALL')
  const [inspect, setInspect] = useState<N8nLog | null>(null)
  const rows = useMemo(() => logs.filter((l) => filter === 'ALL' || l.status === filter), [logs, filter])
  return (
    <div>
      <PageHeader title="Logs de Execução" subtitle="Payloads trocados entre a plataforma e os workflows do N8N">
        <select id="log-filter" className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="ALL">Todos</option><option value="Success">Sucesso</option><option value="Failed">Falhas</option><option value="Pending">Pendentes</option>
        </select>
      </PageHeader>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{['Status', 'Endpoint', 'HTTP', 'Post', 'Quando', ''].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-2"><Skeleton className="h-8" /></td></tr>) : rows.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE[l.status]}`}>{l.status}</span></td>
                <td className="px-4 py-3"><code className="text-xs font-semibold text-slate-600">{endpointOf(l)}</code></td>
                <td className="px-4 py-3 font-mono text-xs">{statusCodeOf(l)}</td>
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-ink-900">{posts.find((p) => p.id === l.postId)?.title ?? l.postId}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtDateTime(l.timestamp)}</td>
                <td className="flex justify-end gap-2 px-4 py-3">
                  <button id={`inspect-${l.id}`} className="btn-ghost btn-sm" onClick={() => setInspect(l)}>Inspecionar JSON</button>
                  <RetryButton log={l} />
                </td>
              </tr>
            ))}
            {!loading && !rows.length && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Nenhum log para este filtro.</td></tr>}
          </tbody>
        </table>
      </div>
      {inspect && <PayloadModal log={inspect} onClose={() => setInspect(null)} />}
    </div>
  )
}

/** Status do Sistema: saúde dos serviços (simulado). */
export function SystemStatus() {
  const { toast } = useStore()
  const base = [
    { name: 'Front-end (SPA)', uptime: '99,99%' }, { name: 'API REST (backend)', uptime: '99,95%' },
    { name: 'N8N · Webhook /publish', uptime: '99,80%' }, { name: 'Banco de dados', uptime: '99,99%' },
    ...NETWORKS.map((n) => ({ name: `${n} API`, uptime: '99,5%' })),
  ]
  const make = () => base.map((s, i) => ({ ...s, latency: 40 + Math.floor(Math.random() * 220), degraded: s.name.startsWith('Facebook') || (i === 2 && Math.random() < 0.2) }))
  const [rows, setRows] = useState(make)
  const [busy, setBusy] = useState(false)
  const check = async () => { setBusy(true); await new Promise((r) => setTimeout(r, 700)); setRows(make()); setBusy(false); toast('Verificação concluída', 'info') }
  return (
    <div>
      <PageHeader title="Status do Sistema" subtitle="Saúde dos serviços e integrações (simulado)">
        <button id="check-status" className="btn-primary" disabled={busy} onClick={check}>{busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Verificar agora</button>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <div key={s.name} className="card flex items-center gap-3 p-4">
            <span className={`h-3 w-3 shrink-0 rounded-full ${s.degraded ? 'bg-yellow-400' : 'bg-green-500'} ${busy ? 'animate-pulse' : ''}`} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink-900">{s.name}</p><p className="text-xs text-slate-500">Uptime {s.uptime}</p></div>
            <div className="text-right"><p className="text-sm font-bold text-ink-900">{s.latency} ms</p><p className={`text-xs font-semibold ${s.degraded ? 'text-yellow-600' : 'text-green-600'}`}>{s.degraded ? 'Degradado' : 'Operacional'}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Configurações de API (simulado). */
export function ApiSettings() {
  const { toast } = useStore()
  const [url, setUrl] = useState('https://n8n.fabrica.com/webhook/publish')
  const [token, setToken] = useState('n8n_live_9f2c41a7d3b8')
  const [show, setShow] = useState(false)
  const [timeout, setTimeoutSec] = useState(30)
  const [retries, setRetries] = useState(3)
  const [testing, setTesting] = useState(false)
  const test = async () => { setTesting(true); await new Promise((r) => setTimeout(r, 800)); setTesting(false); toast('Conexão com o webhook N8N OK (200)') }
  return (
    <div>
      <PageHeader title="Configurações de API" subtitle="Endpoint do N8N, autenticação e política de retry" />
      <form className="card max-w-2xl space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); toast('Configurações salvas com sucesso') }}>
        <div><label className="label" htmlFor="api-url">URL do Webhook N8N</label><input id="api-url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
        <div>
          <label className="label" htmlFor="api-token">Token de autenticação</label>
          <div className="relative">
            <input id="api-token" type={show ? 'text' : 'password'} className="input !pr-10" value={token} onChange={(e) => setToken(e.target.value)} />
            <button type="button" aria-label="Mostrar token" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShow((s) => !s)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label" htmlFor="api-timeout">Timeout (s)</label><input id="api-timeout" type="number" min={1} className="input" value={timeout} onChange={(e) => setTimeoutSec(+e.target.value)} /></div>
          <div><label className="label" htmlFor="api-retries">Tentativas automáticas</label><input id="api-retries" type="number" min={0} className="input" value={retries} onChange={(e) => setRetries(+e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" id="api-test" className="btn-ghost" disabled={testing} onClick={test}>{testing && <Loader2 size={16} className="animate-spin" />} Testar conexão</button>
          <button type="submit" id="api-save" className="btn-primary"><Save size={16} /> Salvar</button>
        </div>
      </form>
    </div>
  )
}
