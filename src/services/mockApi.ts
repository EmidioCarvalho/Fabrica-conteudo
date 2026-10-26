import type { DemandStatus, N8nLog, Post, PostStatus, PublicationDemand, StatusHistory } from '../types'
import { buildInitialDemands, buildInitialLogs, buildInitialPosts, buildWebhookPayload } from './mockData'

/**
 * Camada de serviço isolada. Persistência em localStorage simula o banco de dados.
 * Todas as funções são assíncronas com 300ms de delay para simular chamadas HTTP.
 */
const DELAY = 300
const KEY_POSTS = 'fabrica:posts:v4'
const KEY_LOGS = 'fabrica:logs:v4'
const KEY_DEMANDS = 'fabrica:demands:v4'

const sleep = (ms = DELAY) => new Promise((r) => setTimeout(r, ms))
const uid = () => Math.random().toString(36).slice(2, 10)

function read<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignora JSON inválido */ }
  const v = fallback()
  localStorage.setItem(key, JSON.stringify(v))
  return v
}
const write = (key: string, v: unknown) => localStorage.setItem(key, JSON.stringify(v))

// TODO: Substituir por chamada fetch/axios para a API REST backend (GET /api/demands)
export async function getDemands(): Promise<PublicationDemand[]> {
  await sleep()
  return read<PublicationDemand[]>(KEY_DEMANDS, buildInitialDemands)
}

// TODO: Substituir por chamada fetch/axios para a API REST backend (POST /api/demands)
export async function createDemand(
  data: Pick<PublicationDemand, 'title' | 'briefing' | 'targetNetwork' | 'desiredDate' | 'routeTarget' | 'requestedBy' | 'status'>,
): Promise<PublicationDemand> {
  await sleep()
  const demands = read<PublicationDemand[]>(KEY_DEMANDS, buildInitialDemands)
  const now = new Date().toISOString()
  const demand: PublicationDemand = { ...data, id: `d${uid()}`, createdAt: now, updatedAt: now }
  write(KEY_DEMANDS, [demand, ...demands])
  return demand
}

// TODO: Substituir por chamada fetch/axios para a API REST backend (PATCH /api/demands/:id)
export async function updateDemand(id: string, patch: Partial<Pick<PublicationDemand, 'status' | 'assignedEditorId'>>): Promise<PublicationDemand> {
  await sleep(120)
  const demands = read<PublicationDemand[]>(KEY_DEMANDS, buildInitialDemands)
  const cur = demands.find((d) => d.id === id)
  if (!cur) throw new Error('Solicitação não encontrada')
  const updated = { ...cur, ...patch, updatedAt: new Date().toISOString() }
  write(KEY_DEMANDS, demands.map((d) => (d.id === id ? updated : d)))
  return updated
}

export type { DemandStatus }
export { MOCK_USERS } from './mockData'

// TODO: Substituir por chamada fetch/axios para a API REST backend (GET /api/posts)
export async function getPosts(): Promise<Post[]> {
  await sleep()
  return read<Post[]>(KEY_POSTS, buildInitialPosts)
}

// TODO: Substituir por chamada fetch/axios para a API REST backend (POST /api/posts)
export async function createPost(
  data: Omit<Post, 'id' | 'history' | 'updatedAt' | 'metrics'>,
  author: string,
  notes = 'Publicação criada.',
): Promise<Post> {
  await sleep()
  const posts = read<Post[]>(KEY_POSTS, buildInitialPosts)
  const id = `p${uid()}`
  const now = new Date().toISOString()
  const post: Post = {
    ...data, id, updatedAt: now,
    history: [{ id: `${id}-h0`, postId: id, statusFrom: null, statusTo: data.status, changedBy: author, timestamp: now, notes }],
  }
  write(KEY_POSTS, [post, ...posts])
  return post
}

// TODO: Substituir por chamada fetch/axios para a API REST backend (PUT /api/posts/:id)
export async function updatePost(id: string, patch: Partial<Post>, author: string): Promise<Post> {
  await sleep()
  const posts = read<Post[]>(KEY_POSTS, buildInitialPosts)
  const cur = posts.find((p) => p.id === id)
  if (!cur) throw new Error('Post não encontrado')
  const now = new Date().toISOString()
  const history: StatusHistory[] = [...cur.history]
  if (patch.status && patch.status !== cur.status) {
    history.push({ id: `${id}-h${uid()}`, postId: id, statusFrom: cur.status, statusTo: patch.status, changedBy: author, timestamp: now })
  } else {
    history.push({ id: `${id}-h${uid()}`, postId: id, statusFrom: cur.status, statusTo: cur.status, changedBy: author, timestamp: now, notes: 'Conteúdo editado.' })
  }
  const updated = { ...cur, ...patch, history, updatedAt: now }
  write(KEY_POSTS, posts.map((p) => (p.id === id ? updated : p)))
  return updated
}

// TODO: Substituir por chamada fetch/axios para a API REST backend (PATCH /api/posts/:id/status)
export async function updatePostStatus(id: string, status: PostStatus, author: string, notes?: string, extra: Partial<Post> = {}): Promise<Post> {
  await sleep()
  const posts = read<Post[]>(KEY_POSTS, buildInitialPosts)
  const cur = posts.find((p) => p.id === id)
  if (!cur) throw new Error('Post não encontrado')
  const now = new Date().toISOString()
  const entry: StatusHistory = { id: `${id}-h${uid()}`, postId: id, statusFrom: cur.status, statusTo: status, changedBy: author, timestamp: now, notes }
  const updated: Post = { ...cur, ...extra, status, history: [...cur.history, entry], updatedAt: now }
  write(KEY_POSTS, posts.map((p) => (p.id === id ? updated : p)))
  return updated
}

export async function getN8nLogs(): Promise<N8nLog[]> {
  await sleep()
  return read<N8nLog[]>(KEY_LOGS, buildInitialLogs)
}

// TODO: Substituir por chamada fetch/axios para o Webhook N8N (POST https://<seu-n8n>/webhook/<id>)
export async function triggerN8nWebhook(post: Post, event: string, forceFail = false): Promise<N8nLog> {
  await sleep()
  const logs = read<N8nLog[]>(KEY_LOGS, buildInitialLogs)
  const failed = forceFail || Math.random() < 0.05
  const log: N8nLog = {
    id: `l${uid()}`,
    postId: post.id,
    event,
    payload: buildWebhookPayload(post, failed ? { code: 502, message: 'Falha simulada ao contatar o webhook do N8N' } : undefined),
    status: failed ? 'Failed' : 'Success',
    timestamp: new Date().toISOString(),
  }
  write(KEY_LOGS, [log, ...logs])
  return log
}

// TODO: Substituir por chamada ao endpoint de reprocessamento (POST /api/n8n/retry/:logId)
export async function retryN8nLog(logId: string): Promise<N8nLog> {
  await sleep(600)
  const logs = read<N8nLog[]>(KEY_LOGS, buildInitialLogs)
  const cur = logs.find((l) => l.id === logId)
  if (!cur) throw new Error('Log não encontrado')
  const prev = cur.payload as { request?: unknown }
  const updated: N8nLog = {
    ...cur,
    status: 'Success',
    payload: {
      request: prev.request,
      response: { status: 200, executionId: `exec_${uid().slice(0, 6)}`, message: 'Reprocessado com sucesso (retry manual)' },
      retriedAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  }
  write(KEY_LOGS, logs.map((l) => (l.id === logId ? updated : l)))
  return updated
}

export function resetMockDb() {
  localStorage.removeItem(KEY_POSTS)
  localStorage.removeItem(KEY_LOGS)
  localStorage.removeItem(KEY_DEMANDS)
}
