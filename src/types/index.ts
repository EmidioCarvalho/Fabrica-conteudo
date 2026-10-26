// Interfaces que espelham o banco de dados futuro.

export type Role = 'EDITOR' | 'SOLICITANTE' | 'DEVOPS'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export type SocialNetwork = 'LinkedIn' | 'Instagram' | 'Facebook' | 'X/Twitter' | 'Threads' | 'YouTube Shorts'

export type PostStatus =
  | 'Rascunho'
  | 'Em revisão'
  | 'Ajustes solicitados'
  | 'Aprovado'
  | 'Agendado'
  | 'Publicado'
  | 'Erro'
  | 'EM_REVISAO'
  | 'AJUSTES_SOLICITADOS'
  | 'APROVADO'
  | 'AGENDADO'
  | 'PUBLICADO'
  | 'ERRO'

// ── Solicitações de pauta / briefing ──────────────────────────────────────────
export type RouteTarget = 'EQUIPE_MARKETING' | 'IA_N8N'

export type DemandStatus =
  | 'PENDENTE_EDITOR'
  | 'EM_PRODUCAO'
  | 'EM_REVISAO'
  | 'AJUSTES_SOLICITADOS'
  | 'ENVIADO_IA'
  | 'CONCLUIDO'
  | 'CANCELADO'

export interface PublicationDemand {
  id: string
  title: string
  briefing: string
  targetNetwork: SocialNetwork
  desiredDate: string // YYYY-MM-DD
  routeTarget: RouteTarget // 'EQUIPE_MARKETING' ou 'IA_N8N'
  requestedBy: string // ID do Solicitante
  requestedById?: string
  mediaUrl?: string
  assignedEditorId?: string
  status: DemandStatus
  createdAt: string
  updatedAt: string
}

export interface Metric {
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  engagementRate: number
  conversions: number
}

export interface StatusHistory {
  id: string
  postId: string
  statusFrom: PostStatus | null
  statusTo: PostStatus
  changedBy: string
  timestamp: string
  notes?: string
}

export interface Post {
  id: string
  demandId: string // OBRIGATÓRIO: todo post nasce de uma PublicationDemand
  title: string
  caption: string
  imageUrl?: string
  cta?: string
  socialNetwork: SocialNetwork
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // HH:mm
  editorId: string // ID do Editor responsável ('n8n' quando gerado pela automação)
  status: PostStatus
  rejectionFeedback?: string
  // Campos complementares usados por calendário, campanhas e métricas
  theme?: string
  hashtags?: string
  campaign?: string
  metrics?: Metric
  history: StatusHistory[]
  updatedAt: string
}

export interface N8nLog {
  id: string
  postId: string
  event: string
  payload: Record<string, unknown>
  status: 'Success' | 'Pending' | 'Failed'
  timestamp: string
}
