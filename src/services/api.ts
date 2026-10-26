import type { DemandStatus, N8nLog, Post, PostStatus, PublicationDemand, User } from '../types'

const API_BASE = '/api'

let cachedToken: string | null = null

export function setAuthToken(token: string | null) {
  cachedToken = token
  if (token) {
    localStorage.setItem('fabrica_jwt', token)
  } else {
    localStorage.removeItem('fabrica_jwt')
  }
}

export function getAuthToken(): string | null {
  if (!cachedToken) {
    cachedToken = localStorage.getItem('fabrica_jwt')
  }
  return cachedToken
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Envia cookies HTTP-Only automaticamente
  })

  let data: any = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const error: any = new Error(data?.error || `Erro HTTP ${response.status}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data as T
}

// ── AUTHENTICATION ─────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await request<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAuthToken(res.token)
  return res
}

export async function register(data: { name: string; email: string; password: string; role: string }) {
  return request<{ id: string; email: string; message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function verifyEmail(email: string, code: string) {
  return request<{ success: boolean; message: string; user?: User }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export async function resendCode(email: string) {
  return request<{ success: boolean; message: string }>('/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function getMe(): Promise<{ user: User }> {
  return request<{ user: User }>('/auth/me')
}

export async function logout(): Promise<void> {
  setAuthToken(null)
  try {
    await request('/auth/logout', { method: 'POST' })
  } catch { /* ignora erro de rede no logout */ }
}

// ── DEMANDS ────────────────────────────────────────────────────────────────
export async function getDemands(): Promise<PublicationDemand[]> {
  return request<PublicationDemand[]>('/demands')
}

export async function createDemand(
  data: Pick<PublicationDemand, 'title' | 'briefing' | 'targetNetwork' | 'desiredDate' | 'routeTarget' | 'requestedBy' | 'status'>,
): Promise<PublicationDemand> {
  return request<PublicationDemand>('/demands', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateDemand(
  id: string,
  patch: Partial<Pick<PublicationDemand, 'status' | 'assignedEditorId'>>,
): Promise<PublicationDemand> {
  return request<PublicationDemand>(`/demands/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

// ── POSTS ──────────────────────────────────────────────────────────────────
export async function getPosts(): Promise<Post[]> {
  return request<Post[]>('/posts')
}

export async function createPost(
  data: Omit<Post, 'id' | 'history' | 'updatedAt' | 'metrics'>,
  _author: string,
  notes = 'Publicação criada.',
): Promise<Post> {
  return request<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify({ ...data, notes }),
  })
}

export async function updatePost(id: string, patch: Partial<Post>, _author: string): Promise<Post> {
  return request<Post>(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
  _author: string,
  notes?: string,
  extra: Partial<Post> = {},
): Promise<Post> {
  return request<Post>(`/posts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes, ...extra }),
  })
}

// ── MEDIA UPLOAD ───────────────────────────────────────────────────────────
export async function uploadMedia(file: File, postId?: string): Promise<{ id: string; url: string; filename: string }> {
  const formData = new FormData()
  formData.append('file', file)
  if (postId) formData.append('postId', postId)

  return request<{ id: string; url: string; filename: string }>('/media/upload', {
    method: 'POST',
    body: formData,
  })
}

// ── N8N LOGS & WEBHOOKS ────────────────────────────────────────────────────
export async function getN8nLogs(): Promise<N8nLog[]> {
  return request<N8nLog[]>('/n8n/logs')
}

export async function triggerN8nWebhook(post: Post, _event = 'webhook.publish'): Promise<N8nLog> {
  const res = await request<{ success: boolean; log: N8nLog }>('/n8n/trigger', {
    method: 'POST',
    body: JSON.stringify({ postId: post.id }),
  })
  return res.log
}

export async function retryN8nLog(logId: string): Promise<N8nLog> {
  return request<N8nLog>(`/n8n/retry/${logId}`, {
    method: 'POST',
  })
}

export async function notifyApproval(postId: string, notes?: string): Promise<{ success: boolean; post?: Post; log?: N8nLog }> {
  return request<{ success: boolean; post?: Post; log?: N8nLog }>('/n8n/approve', {
    method: 'POST',
    body: JSON.stringify({ postId, notes }),
  })
}

