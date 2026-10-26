import type { DemandStatus, Metric, N8nLog, Post, PostStatus, PublicationDemand, RouteTarget, SocialNetwork, StatusHistory, User } from '../types'

/** Usuários pré-cadastrados (credenciais fictícias para validar a autenticação tradicional). */
export const MOCK_USERS: (User & { password: string })[] = [
  { id: 'usr-1', name: 'Ana Solicitante', email: 'solicitante@fabrica.com', password: '123456', role: 'SOLICITANTE' },
  { id: 'usr-2', name: 'Carlos Editor', email: 'editor@fabrica.com', password: '123456', role: 'EDITOR' },
  { id: 'usr-3', name: 'Rafa DevOps', email: 'devops@fabrica.com', password: '123456', role: 'DEVOPS' },
]

/** Usuários sem a senha (é o que fica em memória e no localStorage). */
export const USERS: User[] = MOCK_USERS.map(({ password: _p, ...u }) => u)

/** ID usado como "editor" dos posts gerados pela automação. */
export const N8N_EDITOR_ID = 'n8n'

export const userName = (id?: string) =>
  !id ? '—' : id === N8N_EDITOR_ID ? 'N8N (IA)' : USERS.find((u) => u.id === id)?.name ?? id
export const CAMPAIGNS = ['Lançamento Q4', 'Black Friday', 'Institucional', 'Webinars de Outubro', 'Employer Branding']
export const NETWORKS: SocialNetwork[] = ['LinkedIn', 'Instagram', 'Facebook', 'X/Twitter', 'Threads', 'YouTube Shorts']
export const STATUSES: PostStatus[] = [
  'Rascunho', 'Em revisão', 'Ajustes solicitados', 'Aprovado', 'Agendado', 'Publicado', 'Erro',
]

const PALETTES = [
  ['#6366f1', '#a855f7'], ['#0ea5e9', '#6366f1'], ['#f97316', '#ec4899'],
  ['#10b981', '#0ea5e9'], ['#f43f5e', '#f59e0b'], ['#8b5cf6', '#06b6d4'],
]

/** Gera uma imagem SVG (data URI) para servir de thumbnail do protótipo. */
export function makeThumb(seed: number, label = ''): string {
  const [a, b] = PALETTES[seed % PALETTES.length]
  const text = label.slice(0, 22).replace(/[<&]/g, '')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><circle cx='${80 + (seed % 5) * 60}' cy='80' r='70' fill='white' opacity='.15'/><circle cx='330' cy='250' r='90' fill='white' opacity='.12'/><text x='24' y='270' font-family='Arial' font-weight='bold' font-size='22' fill='white'>${text}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const iso = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const ts = (offsetDays: number, h = 10) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(h, 15, 0, 0)
  return d.toISOString()
}

const metrics = (k: number): Metric => ({
  reach: 4200 * k, impressions: 6100 * k, likes: 310 * k, comments: 42 * k, shares: 58 * k,
  saves: 36 * k, clicks: 190 * k, engagementRate: +(3.2 + k * 0.7).toFixed(1), conversions: 12 * k,
})

interface Seed {
  title: string; theme: string; net: SocialNetwork; status: PostStatus; day: number; time: string
  campaign: string; editor: string; cta: string; route: RouteTarget; measured?: boolean
}

const MKT: RouteTarget = 'EQUIPE_MARKETING'
const IA: RouteTarget = 'IA_N8N'

const SEEDS: Seed[] = [
  { title: '5 tendências de IA para 2026', theme: 'Inteligência Artificial', net: 'LinkedIn', status: 'Publicado', measured: true, day: -6, time: '09:00', campaign: 'Institucional', editor: 'usr-2', cta: 'Leia o artigo completo', route: MKT },
  { title: 'Bastidores da nossa equipe', theme: 'Cultura', net: 'Instagram', status: 'Publicado', measured: true, day: -5, time: '12:30', campaign: 'Employer Branding', editor: 'usr-2', cta: 'Conheça as vagas', route: MKT },
  { title: 'Webinar: Automação com N8N', theme: 'Automação', net: 'LinkedIn', status: 'Publicado', day: -3, time: '10:00', campaign: 'Webinars de Outubro', editor: N8N_EDITOR_ID, cta: 'Garanta sua vaga', route: IA },
  { title: 'Dica rápida: atalhos de produtividade', theme: 'Produtividade', net: 'YouTube Shorts', status: 'Publicado', day: -2, time: '18:00', campaign: 'Institucional', editor: 'usr-2', cta: 'Inscreva-se no canal', route: MKT },
  { title: 'Teaser da Black Friday', theme: 'Promoções', net: 'Instagram', status: 'Publicado', day: -1, time: '19:00', campaign: 'Black Friday', editor: 'usr-2', cta: 'Ative os lembretes', route: MKT },
  { title: 'Case de sucesso: Cliente Alfa', theme: 'Cases', net: 'LinkedIn', status: 'Agendado', day: 1, time: '09:30', campaign: 'Lançamento Q4', editor: N8N_EDITOR_ID, cta: 'Baixe o case', route: IA },
  { title: 'Thread: erros comuns em automação', theme: 'Educação', net: 'X/Twitter', status: 'Agendado', day: 2, time: '11:00', campaign: 'Institucional', editor: N8N_EDITOR_ID, cta: 'Siga para mais', route: IA },
  { title: 'Oferta relâmpago de lançamento', theme: 'Promoções', net: 'Facebook', status: 'Agendado', day: 3, time: '15:00', campaign: 'Lançamento Q4', editor: N8N_EDITOR_ID, cta: 'Compre agora', route: IA },
  { title: 'Contagem regressiva Black Friday', theme: 'Promoções', net: 'Threads', status: 'Aprovado', day: 4, time: '08:00', campaign: 'Black Friday', editor: 'usr-2', cta: 'Veja as ofertas', route: MKT },
  { title: 'Quem somos: nossa missão', theme: 'Institucional', net: 'Facebook', status: 'Aprovado', day: 5, time: '14:00', campaign: 'Institucional', editor: 'usr-2', cta: 'Saiba mais', route: MKT },
  { title: 'Guia: como criar um funil de conteúdo', theme: 'Marketing', net: 'LinkedIn', status: 'Em revisão', day: 6, time: '09:00', campaign: 'Lançamento Q4', editor: 'usr-2', cta: 'Baixe o guia', route: MKT },
  { title: 'Carrossel: 7 métricas essenciais', theme: 'Métricas', net: 'Instagram', status: 'Em revisão', day: 7, time: '17:00', campaign: 'Webinars de Outubro', editor: 'usr-2', cta: 'Salve este post', route: MKT },
  { title: 'Vídeo curto: tour pela plataforma', theme: 'Produto', net: 'YouTube Shorts', status: 'Ajustes solicitados', day: 8, time: '12:00', campaign: 'Lançamento Q4', editor: 'usr-2', cta: 'Teste grátis', route: MKT },
  { title: 'Vaga aberta: Designer de Conteúdo', theme: 'Recrutamento', net: 'LinkedIn', status: 'Ajustes solicitados', day: 9, time: '10:30', campaign: 'Employer Branding', editor: 'usr-2', cta: 'Candidate-se', route: MKT },
  { title: 'Ideias de pauta para Novembro', theme: 'Planejamento', net: 'Threads', status: 'Rascunho', day: 10, time: '09:00', campaign: 'Institucional', editor: 'usr-2', cta: 'Comente sua ideia', route: MKT },
  { title: 'Enquete: qual rede você mais usa?', theme: 'Engajamento', net: 'X/Twitter', status: 'Rascunho', day: 11, time: '16:00', campaign: 'Institucional', editor: 'usr-2', cta: 'Vote agora', route: MKT },
  { title: 'Lançamento do e-book de IA', theme: 'Inteligência Artificial', net: 'Facebook', status: 'Erro', day: 0, time: '13:00', campaign: 'Lançamento Q4', editor: N8N_EDITOR_ID, cta: 'Baixe grátis', route: IA },
  { title: 'Convite para o webinar de IA', theme: 'Webinars', net: 'Instagram', status: 'Erro', day: 0, time: '16:30', campaign: 'Webinars de Outubro', editor: N8N_EDITOR_ID, cta: 'Inscreva-se', route: IA },
]

/** Demandas sem post ainda: aguardam um Editor assumir (ou foram canceladas). */
const OPEN_DEMANDS: { title: string; briefing: string; net: SocialNetwork; day: number; status: DemandStatus }[] = [
  { title: 'Divulgar nova integração com CRM', briefing: 'Anunciar a integração nativa com o CRM. Tom profissional, destacar a economia de tempo e incluir CTA para a página de demonstração.', net: 'LinkedIn', day: 12, status: 'PENDENTE_EDITOR' },
  { title: 'Stories: bastidores do evento', briefing: 'Série curta de stories mostrando a montagem do estande e a equipe. Linguagem leve e descontraída.', net: 'Instagram', day: 13, status: 'PENDENTE_EDITOR' },
  { title: 'Comunicado sobre manutenção programada', briefing: 'Avisar clientes sobre a janela de manutenção de sábado, das 22h às 02h. Texto curto e objetivo.', net: 'X/Twitter', day: 4, status: 'PENDENTE_EDITOR' },
  { title: 'Post de aniversário da empresa', briefing: 'Celebrar 5 anos da Fábrica de Conteúdo (cancelado: será tratado em campanha própria).', net: 'Facebook', day: 20, status: 'CANCELADO' },
]

const POST_FLOW: PostStatus[] = ['Rascunho', 'Em revisão', 'Aprovado', 'Publicado']

function postPath(s: Seed): PostStatus[] {
  if (s.route === IA) return s.status === 'Erro' ? ['Agendado', 'Erro'] : s.status === 'Publicado' ? ['Agendado', 'Publicado'] : ['Agendado']
  if (s.status === 'Ajustes solicitados') return ['Rascunho', 'Em revisão', 'Ajustes solicitados']
  return POST_FLOW.slice(0, POST_FLOW.indexOf(s.status) + 1)
}

function demandStatusOf(s: Seed): DemandStatus {
  if (s.route === IA) return s.status === 'Publicado' ? 'CONCLUIDO' : 'ENVIADO_IA'
  return { Rascunho: 'EM_PRODUCAO', 'Em revisão': 'EM_REVISAO', 'Ajustes solicitados': 'AJUSTES_SOLICITADOS', Aprovado: 'EM_PRODUCAO', Publicado: 'CONCLUIDO' }[s.status as 'Rascunho'] as DemandStatus
}

const SOLICITANTE_ID = 'usr-1'
const BRIEFING = (s: Seed) => `Criar publicação sobre "${s.title}" (tema: ${s.theme}). Objetivo: gerar engajamento e levar o público para o CTA "${s.cta}".`

function buildHistory(id: string, s: Seed): StatusHistory[] {
  const path = postPath(s)
  return path.map((to, i) => ({
    id: `${id}-h${i}`,
    postId: id,
    statusFrom: i === 0 ? null : path[i - 1],
    statusTo: to,
    changedBy: to === 'Aprovado' || to === 'Ajustes solicitados' ? 'Ana Solicitante' : s.route === IA ? 'N8N (automação)' : userName(s.editor),
    timestamp: ts(Math.min(s.day, 0) - (path.length - i), 9 + i),
    notes: to === 'Ajustes solicitados' ? 'Revisar tom de voz e ajustar o CTA.' : to === 'Erro' ? 'Falha de autenticação na API da rede social (401).' : undefined,
  }))
}

export function buildInitialDemands(): PublicationDemand[] {
  const fromPosts = SEEDS.map((s, i): PublicationDemand => ({
    id: `d${i + 1}`,
    title: s.title,
    briefing: BRIEFING(s),
    targetNetwork: s.net,
    desiredDate: iso(s.day),
    routeTarget: s.route,
    requestedBy: SOLICITANTE_ID,
    assignedEditorId: s.route === IA ? undefined : s.editor,
    status: demandStatusOf(s),
    createdAt: ts(Math.min(s.day, 0) - 8, 9),
    updatedAt: ts(Math.min(s.day, 0), 9 + (i % 8)),
  }))
  const open = OPEN_DEMANDS.map((d, i): PublicationDemand => ({
    id: `d${SEEDS.length + i + 1}`,
    title: d.title, briefing: d.briefing, targetNetwork: d.net, desiredDate: iso(d.day),
    routeTarget: MKT, requestedBy: SOLICITANTE_ID, status: d.status,
    createdAt: ts(-i - 1, 11), updatedAt: ts(-i - 1, 11),
  }))
  return [...open, ...fromPosts]
}

export function buildInitialPosts(): Post[] {
  return SEEDS.map((s, i) => {
    const id = `p${i + 1}`
    return {
      id,
      demandId: `d${i + 1}`,
      title: s.title,
      theme: s.theme,
      caption: `${s.title} 🚀\n\nUm conteúdo preparado pela nossa equipe sobre ${s.theme.toLowerCase()}. Compartilhe com quem precisa ver isso hoje!`,
      imageUrl: makeThumb(i, s.theme),
      cta: s.cta,
      hashtags: '#marketingdigital #conteudo #automacao',
      socialNetwork: s.net,
      scheduledDate: iso(s.day),
      scheduledTime: s.time,
      campaign: s.campaign,
      editorId: s.editor,
      status: s.status,
      rejectionFeedback: s.status === 'Ajustes solicitados' ? 'Revisar tom de voz e ajustar o CTA.' : undefined,
      metrics: s.measured ? metrics(i + 1) : undefined,
      history: buildHistory(id, s),
      updatedAt: ts(Math.min(s.day, 0), 9 + (i % 8)),
    }
  })
}

export const WEBHOOK_ENDPOINT = 'POST /webhook/publish'

/** Monta o payload JSON trocado entre a plataforma e o workflow do N8N. */
export function buildWebhookPayload(
  p: { id: string; demandId?: string; title: string; socialNetwork: string; caption: string; hashtags?: string; cta?: string; scheduledDate: string; scheduledTime: string },
  error?: { code: number; message: string },
): Record<string, unknown> {
  return {
    request: {
      endpoint: WEBHOOK_ENDPOINT,
      headers: { 'Content-Type': 'application/json', 'X-Fabrica-Signature': 'sha256=9f2c…' },
      body: {
        postId: p.id, demandId: p.demandId, title: p.title, network: p.socialNetwork, caption: p.caption,
        hashtags: p.hashtags ?? '', cta: p.cta ?? '', scheduledAt: `${p.scheduledDate}T${p.scheduledTime}:00-03:00`,
        options: { aiFormatting: true, aiOptimization: true, autoPublish: true },
      },
    },
    response: error
      ? { status: error.code, error: error.message, node: `${p.socialNetwork} API` }
      : { status: 200, executionId: `exec_${Math.random().toString(36).slice(2, 8)}`, message: 'Workflow iniciado: formatação por IA e publicação automática' },
  }
}

export function buildInitialLogs(): N8nLog[] {
  const posts = buildInitialPosts()
  const get = (id: string) => posts.find((p) => p.id === id)!
  return [
    { id: 'l1', postId: 'p6', event: 'webhook.publish', payload: buildWebhookPayload(get('p6')), status: 'Success', timestamp: ts(0, 8) },
    { id: 'l2', postId: 'p3', event: 'webhook.publish', payload: buildWebhookPayload(get('p3')), status: 'Success', timestamp: ts(-3, 10) },
    { id: 'l3', postId: 'p17', event: 'webhook.publish', payload: buildWebhookPayload(get('p17'), { code: 401, message: 'Falha de autenticação: token do Facebook expirado' }), status: 'Failed', timestamp: ts(0, 13) },
    { id: 'l4', postId: 'p18', event: 'webhook.publish', payload: buildWebhookPayload(get('p18'), { code: 504, message: 'Timeout ao chamar a API do Instagram' }), status: 'Failed', timestamp: ts(0, 16) },
  ]
}
