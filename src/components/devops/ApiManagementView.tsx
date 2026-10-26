import { useState } from 'react'
import { Bot, Eye, EyeOff, KeyRound, Loader2, Plug, Save, Share2, Webhook } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PageHeader } from '../ui'

type ConnStatus = 'Conectado' | 'Token Expirando' | 'Erro'
type QuotaStatus = 'Normal' | 'Próximo do limite' | 'Cota esgotada'

interface SocialApi { id: string; name: string; scope: string; status: ConnStatus; clientKey: string; expires: string }
interface AiProvider { id: string; name: string; model: string; apiKey: string; used: number; limit: number }

const CONN_STYLE: Record<ConnStatus, string> = {
  Conectado: 'bg-green-50 text-green-700',
  'Token Expirando': 'bg-yellow-50 text-yellow-800',
  Erro: 'bg-red-50 text-red-700',
}
const CONN_DOT: Record<ConnStatus, string> = { Conectado: 'bg-green-500', 'Token Expirando': 'bg-yellow-400', Erro: 'bg-red-500' }

const mask = (k: string) => (k.length <= 8 ? '••••••••' : `${k.slice(0, 4)}${'•'.repeat(12)}${k.slice(-4)}`)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const quotaOf = (p: AiProvider): QuotaStatus => {
  const pct = (p.used / p.limit) * 100
  return pct >= 100 ? 'Cota esgotada' : pct >= 80 ? 'Próximo do limite' : 'Normal'
}
const QUOTA_STYLE: Record<QuotaStatus, { badge: string; bar: string }> = {
  Normal: { badge: 'bg-green-50 text-green-700', bar: 'bg-green-500' },
  'Próximo do limite': { badge: 'bg-yellow-50 text-yellow-800', bar: 'bg-yellow-400' },
  'Cota esgotada': { badge: 'bg-red-50 text-red-700', bar: 'bg-red-500' },
}

/** Campo de segredo mascarado, com botão de revelar. */
function Secret({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input !pr-10 font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
      <button type="button" aria-label={show ? 'Ocultar chave' : 'Mostrar chave'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function Section({ icon: Icon, title, desc, children }: { icon: typeof Plug; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="card mb-6 p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon size={20} /></div>
        <div><h2 className="font-bold text-ink-900">{title}</h2><p className="text-xs text-slate-500">{desc}</p></div>
      </div>
      {children}
    </section>
  )
}

/** Aba 2 do DevOps: APIs de redes sociais, N8N e provedores de IA (dados simulados). */
export default function ApiManagementView() {
  const { toast } = useStore()
  const [busy, setBusy] = useState<string | null>(null)

  const [socials, setSocials] = useState<SocialApi[]>([
    { id: 'linkedin', name: 'LinkedIn API', scope: 'Páginas e posts da organização', status: 'Conectado', clientKey: '86f2k9a1xq7p4d3m', expires: '+58 dias' },
    { id: 'meta', name: 'Meta API (Instagram/Facebook)', scope: 'Graph API · publicação em Páginas e Instagram', status: 'Token Expirando', clientKey: '1029384756abcdef', expires: 'em 3 dias' },
    { id: 'x', name: 'X/Twitter API', scope: 'API v2 · publicação de posts e threads', status: 'Erro', clientKey: 'xTw9Kq2LmN8vB5cR', expires: 'expirado' },
    { id: 'threads', name: 'Threads API', scope: 'Publicação de threads', status: 'Conectado', clientKey: 'thr3adsK3yZ91Wq8', expires: '+41 dias' },
    { id: 'youtube', name: 'YouTube API', scope: 'Data API v3 · upload de Shorts', status: 'Conectado', clientKey: 'AIzaSyD4f7Qk2LpR9xYt', expires: '+27 dias' },
  ])
  const [n8nUrl, setN8nUrl] = useState('https://n8n.fabrica.com')
  const [n8nKey, setN8nKey] = useState('n8n_api_9f2c41a7d3b8e6f1')
  const [ai, setAi] = useState<AiProvider[]>([
    { id: 'openai', name: 'OpenAI', model: 'GPT-4o', apiKey: 'sk-proj-8f2c41a7d3b8e6f1a9', used: 42_000, limit: 100_000 },
    { id: 'anthropic', name: 'Anthropic', model: 'Claude', apiKey: 'sk-ant-api03-71d9c0b2e4a85f', used: 88_000, limit: 100_000 },
    { id: 'gemini', name: 'Google Gemini', model: 'Gemini Pro', apiKey: 'AIzaSyB2c9e1f4a7d3m8k5', used: 100_000, limit: 100_000 },
  ])

  const testSocial = async (a: SocialApi) => {
    setBusy(a.id)
    await sleep(900)
    setBusy(null)
    if (a.status === 'Erro') return toast(`${a.name}: falha no OAuth (401). Gere novas credenciais e teste novamente.`, 'error')
    setSocials((l) => l.map((x) => (x.id === a.id ? { ...x, status: 'Conectado', expires: '+60 dias' } : x)))
    toast(a.status === 'Token Expirando' ? `${a.name}: token renovado via OAuth com sucesso!` : `${a.name}: conexão OK (200)`)
  }
  const editSocialKey = (id: string, clientKey: string) =>
    setSocials((l) => l.map((x) => (x.id === id ? { ...x, clientKey, status: x.status === 'Erro' ? 'Token Expirando' : x.status } : x)))

  const testN8n = async () => {
    setBusy('n8n'); await sleep(800); setBusy(null)
    if (!/^https?:\/\/.+/.test(n8nUrl) || !n8nKey.trim()) return toast('URL inválida ou X-N8N-API-KEY ausente', 'error')
    toast('Servidor N8N respondeu 200 · X-N8N-API-KEY válida')
  }
  const testAi = async (p: AiProvider) => {
    setBusy(p.id); await sleep(800); setBusy(null)
    if (quotaOf(p) === 'Cota esgotada') return toast(`${p.name}: cota esgotada (429). Aumente o limite ou troque a chave.`, 'error')
    toast(`${p.name}: chave válida`)
  }

  return (
    <div>
      <PageHeader title="Gestão de APIs e Credenciais" subtitle="Conexões com redes sociais, servidor N8N e provedores de IA (dados simulados)" />

      <Section icon={Share2} title="APIs de Redes Sociais" desc="Status da conexão OAuth e chaves de cliente">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="py-2 pr-3">API</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Client Key</th><th className="px-3 py-2">Token</th><th className="py-2 pl-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {socials.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 pr-3"><p className="font-semibold text-ink-900">{a.name}</p><p className="text-xs text-slate-500">{a.scope}</p></td>
                  <td className="px-3 py-3"><span id={`status-${a.id}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CONN_STYLE[a.status]}`}><span className={`h-1.5 w-1.5 rounded-full ${CONN_DOT[a.status]}`} />{a.status}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-600"><KeyRound size={12} className="text-slate-400" />{mask(a.clientKey)}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{a.expires}</td>
                  <td className="py-3 pl-3 text-right">
                    <button id={`test-${a.id}`} className="btn-ghost btn-sm" disabled={busy === a.id} onClick={() => testSocial(a)}>
                      {busy === a.id ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />} Testar Conexão / OAuth
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-brand-600">Editar Client Keys</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {socials.map((a) => (
              <div key={a.id}><label className="label" htmlFor={`key-${a.id}`}>{a.name}</label><Secret id={`key-${a.id}`} value={a.clientKey} onChange={(v) => editSocialKey(a.id, v)} /></div>
            ))}
          </div>
        </details>
      </Section>

      <Section icon={Webhook} title="Webhooks N8N" desc="URL base do servidor e chave de API (cabeçalho X-N8N-API-KEY)">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); toast('Configurações do N8N salvas com sucesso') }}>
          <div><label className="label" htmlFor="n8n-url">URL base do servidor N8N</label><input id="n8n-url" className="input" value={n8nUrl} onChange={(e) => setN8nUrl(e.target.value)} /></div>
          <div><label className="label" htmlFor="n8n-key">X-N8N-API-KEY</label><Secret id="n8n-key" value={n8nKey} onChange={setN8nKey} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" id="n8n-test" className="btn-ghost" disabled={busy === 'n8n'} onClick={testN8n}>{busy === 'n8n' && <Loader2 size={16} className="animate-spin" />} Testar conexão</button>
            <button type="submit" id="n8n-save" className="btn-primary"><Save size={16} /> Salvar</button>
          </div>
        </form>
      </Section>

      <Section icon={Bot} title="Provedores de IA" desc="Chaves de API e consumo da cota mensal de tokens">
        <div className="grid gap-4 lg:grid-cols-3">
          {ai.map((p) => {
            const q = quotaOf(p)
            const pct = Math.min(100, Math.round((p.used / p.limit) * 100))
            return (
              <div key={p.id} className="rounded-xl p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="font-bold text-ink-900">{p.name}</p><p className="text-xs text-slate-500">{p.model}</p></div>
                  <span id={`quota-${p.id}`} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${QUOTA_STYLE[q].badge}`}>{q}</span>
                </div>
                <div className="mt-3"><label className="label" htmlFor={`ai-${p.id}`}>API Key</label>
                  <Secret id={`ai-${p.id}`} value={p.apiKey} onChange={(v) => setAi((l) => l.map((x) => (x.id === p.id ? { ...x, apiKey: v } : x)))} />
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Cota usada</span><span>{p.used.toLocaleString('pt-BR')} / {p.limit.toLocaleString('pt-BR')} ({pct}%)</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${QUOTA_STYLE[q].bar}`} style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="mt-4 flex justify-between gap-2">
                  <button className="btn-ghost btn-sm" onClick={() => { setAi((l) => l.map((x) => (x.id === p.id ? { ...x, limit: x.limit + 50_000 } : x))); toast(`Limite de ${p.name} ampliado em 50 mil tokens`, 'info') }}>+ Ampliar cota</button>
                  <button id={`ai-test-${p.id}`} className="btn-primary btn-sm" disabled={busy === p.id} onClick={() => testAi(p)}>{busy === p.id && <Loader2 size={12} className="animate-spin" />} Testar chave</button>
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
