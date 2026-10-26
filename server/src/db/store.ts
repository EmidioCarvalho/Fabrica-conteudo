import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { prisma, isDbConnected } from './prisma'
import { safeGetTime } from '../utils/date'

export interface UserEntity {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'SOLICITANTE' | 'EDITOR' | 'DEVOPS'
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED'
  emailVerified: boolean
  verificationToken?: string | null
  tokenExpiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface DemandEntity {
  id: string
  title: string
  briefing: string
  targetNetwork: string
  desiredDate?: string | null
  routeTarget: string
  status: string
  requestedById: string
  assignedEditorId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PostEntity {
  id: string
  demandId: string
  title: string
  caption: string
  imageUrl?: string | null
  cta?: string | null
  socialNetwork: string
  scheduledDate?: string | null
  scheduledTime?: string | null
  editorId?: string | null
  status: string
  rejectionFeedback?: string | null
  theme?: string | null
  hashtags?: string | null
  campaign?: string | null
  metrics?: any
  createdAt: Date
  updatedAt: Date
  history?: HistoryEntity[]
}

export interface HistoryEntity {
  id: string
  postId: string
  statusFrom?: string | null
  statusTo: string
  changedBy: string
  notes?: string | null
  timestamp: Date
}

export interface MediaEntity {
  id: string
  filename: string
  url: string
  mimeType: string
  sizeBytes: number
  postId?: string | null
  uploadedById?: string | null
  createdAt: Date
}

export interface N8nLogEntity {
  id: string
  demandId?: string | null
  postId?: string | null
  event: string
  payload: any
  response?: any
  status: 'Success' | 'Failed' | 'Pending'
  timestamp: Date
}

// In-Memory initial seed data
const defaultPasswordHash = bcrypt.hashSync('123456', 10)

const memoryUsers: UserEntity[] = [
  {
    id: 'u-solicitante',
    name: 'Ana Solicitante',
    email: 'solicitante@fabrica.com',
    passwordHash: defaultPasswordHash,
    role: 'SOLICITANTE',
    status: 'ACTIVE',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'u-editor',
    name: 'Carlos Editor',
    email: 'editor@fabrica.com',
    passwordHash: defaultPasswordHash,
    role: 'EDITOR',
    status: 'ACTIVE',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'u-devops',
    name: 'Beatriz DevOps',
    email: 'devops@fabrica.com',
    passwordHash: defaultPasswordHash,
    role: 'DEVOPS',
    status: 'ACTIVE',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const memoryDemands: DemandEntity[] = [
  {
    id: 'd-1',
    title: '5 Tendências de IA no Marketing para 2027',
    briefing: 'Carrossel educativo explorando agentes autônomos, personalização em tempo real e automação editorial.',
    targetNetwork: 'LinkedIn',
    desiredDate: '2026-11-05',
    routeTarget: 'EQUIPE_MARKETING',
    status: 'EM_PRODUCAO',
    requestedById: 'u-solicitante',
    assignedEditorId: 'u-editor',
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(),
  },
  {
    id: 'd-2',
    title: 'Lançamento do Webinar Fábrica de Conteúdo',
    briefing: 'Post chamativo convidando a comunidade para assistir a demonstração ao vivo da esteira automatizada.',
    targetNetwork: 'Instagram',
    desiredDate: '2026-11-10',
    routeTarget: 'IA_N8N',
    status: 'ENVIADO_IA',
    requestedById: 'u-solicitante',
    assignedEditorId: null,
    createdAt: new Date(Date.now() - 3600000 * 12),
    updatedAt: new Date(),
  },
]

const memoryPosts: PostEntity[] = [
  {
    id: 'p-1',
    demandId: 'd-1',
    title: '5 Tendências de IA no Marketing para 2027',
    caption: 'A inteligência artificial não substitui a criatividade humana; ela a potencializa. Conheça as 5 principais tendências que transformarão o marketing nos próximos meses.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    cta: 'Comente "TENDENCIAS" para receber o material completo.',
    socialNetwork: 'LinkedIn',
    scheduledDate: '2026-11-05',
    scheduledTime: '10:00',
    editorId: 'u-editor',
    status: 'Em revisão',
    theme: 'Inteligência Artificial',
    hashtags: '#Marketing #IA #Inovacao',
    campaign: 'Tendências 2027',
    createdAt: new Date(Date.now() - 3600000 * 18),
    updatedAt: new Date(),
    history: [
      {
        id: 'h-1',
        postId: 'p-1',
        statusFrom: null,
        statusTo: 'Rascunho',
        changedBy: 'Carlos Editor',
        notes: 'Criação do rascunho inicial.',
        timestamp: new Date(Date.now() - 3600000 * 18),
      },
      {
        id: 'h-2',
        postId: 'p-1',
        statusFrom: 'Rascunho',
        statusTo: 'Em revisão',
        changedBy: 'Carlos Editor',
        notes: 'Texto revisado e enviado para validação.',
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
    ],
  },
  {
    id: 'p-2',
    demandId: 'd-2',
    title: 'Lançamento do Webinar Fábrica de Conteúdo',
    caption: 'Descubra como integrar IA, N8N e redes sociais em uma esteira editorial moderna e infalível. Link na bio!',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    cta: 'Inscreva-se gratuitamente no link da bio.',
    socialNetwork: 'Instagram',
    scheduledDate: '2026-11-10',
    scheduledTime: '14:30',
    editorId: 'n8n',
    status: 'Agendado',
    theme: 'Webinar',
    hashtags: '#Webinar #N8N #Automacao',
    campaign: 'Lançamento Q4',
    createdAt: new Date(Date.now() - 3600000 * 10),
    updatedAt: new Date(),
    history: [
      {
        id: 'h-3',
        postId: 'p-2',
        statusFrom: null,
        statusTo: 'Agendado',
        changedBy: 'N8N (automação)',
        notes: 'Gerado e agendado pelo workflow N8N.',
        timestamp: new Date(Date.now() - 3600000 * 10),
      },
    ],
  },
]

const memoryMedias: MediaEntity[] = []
const memoryLogs: N8nLogEntity[] = [
  {
    id: 'log-1',
    demandId: 'd-2',
    postId: 'p-2',
    event: 'webhook.publish',
    payload: {
      request: {
        route: 'instagram',
        title: 'Lançamento do Webinar Fábrica de Conteúdo',
        scheduled_at: '2026-11-10T14:30:00Z',
      },
      response: { status: 202, accepted: true },
    },
    status: 'Success',
    timestamp: new Date(Date.now() - 3600000 * 10),
  },
]

// ── USER REPOSITORY ────────────────────────────────────────────────────────
export const UserRepo = {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const cleanEmail = email.trim().toLowerCase()
    if (isDbConnected()) {
      try {
        const u = await prisma.user.findUnique({ where: { email: cleanEmail } })
        return u as UserEntity | null
      } catch (err) {
        console.warn('[UserRepo] Fallback para memória ao buscar por email:', err)
      }
    }
    return memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null
  },

  async findById(id: string): Promise<UserEntity | null> {
    if (isDbConnected()) {
      try {
        const u = await prisma.user.findUnique({ where: { id } })
        return u as UserEntity | null
      } catch (err) {
        console.warn('[UserRepo] Fallback para memória ao buscar por id:', err)
      }
    }
    return memoryUsers.find((u) => u.id === id) || null
  },

  async create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const cleanEmail = data.email.trim().toLowerCase()
    if (isDbConnected()) {
      try {
        const u = await prisma.user.create({
          data: {
            ...data,
            email: cleanEmail,
          },
        })
        return u as UserEntity
      } catch (err) {
        console.warn('[UserRepo] Fallback para memória ao criar usuário:', err)
      }
    }
    const newUser: UserEntity = {
      ...data,
      id: uuidv4(),
      email: cleanEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    memoryUsers.push(newUser)
    return newUser
  },

  async update(id: string, patch: Partial<UserEntity>): Promise<UserEntity> {
    if (isDbConnected()) {
      try {
        const u = await prisma.user.update({
          where: { id },
          data: patch,
        })
        return u as UserEntity
      } catch (err) {
        console.warn('[UserRepo] Fallback para memória ao atualizar usuário:', err)
      }
    }
    const idx = memoryUsers.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error('Usuário não encontrado')
    memoryUsers[idx] = { ...memoryUsers[idx], ...patch, updatedAt: new Date() }
    return memoryUsers[idx]
  },
}

// ── DEMAND REPOSITORY ──────────────────────────────────────────────────────
export const DemandRepo = {
  async list(): Promise<DemandEntity[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.publicationDemand.findMany({
          orderBy: { createdAt: 'desc' },
        })
        return list as DemandEntity[]
      } catch (err) {
        console.warn('[DemandRepo] Fallback para memória ao listar demandas:', err)
      }
    }
    return [...memoryDemands].sort((a, b) => safeGetTime(b.createdAt) - safeGetTime(a.createdAt))
  },

  async findById(id: string): Promise<DemandEntity | null> {
    if (isDbConnected()) {
      try {
        const d = await prisma.publicationDemand.findUnique({ where: { id } })
        return d as DemandEntity | null
      } catch (err) {
        console.warn('[DemandRepo] Fallback para memória ao buscar demanda:', err)
      }
    }
    return memoryDemands.find((d) => d.id === id) || null
  },

  async create(data: Omit<DemandEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DemandEntity> {
    if (isDbConnected()) {
      try {
        const d = await prisma.publicationDemand.create({
          data,
        })
        return d as DemandEntity
      } catch (err) {
        console.warn('[DemandRepo] Fallback para memória ao criar demanda:', err)
      }
    }
    const newDemand: DemandEntity = {
      ...data,
      id: `d-${uuidv4().slice(0, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    memoryDemands.unshift(newDemand)
    return newDemand
  },

  async update(id: string, patch: Partial<DemandEntity>): Promise<DemandEntity> {
    if (isDbConnected()) {
      try {
        const d = await prisma.publicationDemand.update({
          where: { id },
          data: patch,
        })
        return d as DemandEntity
      } catch (err) {
        console.warn('[DemandRepo] Fallback para memória ao atualizar demanda:', err)
      }
    }
    const idx = memoryDemands.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error('Demanda não encontrada')
    memoryDemands[idx] = { ...memoryDemands[idx], ...patch, updatedAt: new Date() }
    return memoryDemands[idx]
  },
}

// ── POST REPOSITORY ────────────────────────────────────────────────────────
export const PostRepo = {
  async list(): Promise<PostEntity[]> {
    if (isDbConnected()) {
      try {
        const posts = await prisma.post.findMany({
          include: {
            history: { orderBy: { timestamp: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        })
        return posts as unknown as PostEntity[]
      } catch (err) {
        console.warn('[PostRepo] Fallback para memória ao listar posts:', err)
      }
    }
    return [...memoryPosts].sort((a, b) => safeGetTime(b.createdAt) - safeGetTime(a.createdAt))
  },

  async findById(id: string): Promise<PostEntity | null> {
    if (isDbConnected()) {
      try {
        const post = await prisma.post.findUnique({
          where: { id },
          include: { history: { orderBy: { timestamp: 'asc' } } },
        })
        return post as unknown as PostEntity | null
      } catch (err) {
        console.warn('[PostRepo] Fallback para memória ao buscar post:', err)
      }
    }
    return memoryPosts.find((p) => p.id === id) || null
  },

  async create(data: Omit<PostEntity, 'id' | 'createdAt' | 'updatedAt' | 'history'>, author: string, notes = 'Publicação criada.'): Promise<PostEntity> {
    const postId = `p-${uuidv4().slice(0, 8)}`
    const now = new Date()

    if (isDbConnected()) {
      try {
        const post = await prisma.post.create({
          data: {
            id: postId,
            ...data,
            history: {
              create: {
                statusFrom: null,
                statusTo: data.status,
                changedBy: author,
                notes,
                timestamp: now,
              },
            },
          },
          include: { history: true },
        })
        return post as unknown as PostEntity
      } catch (err) {
        console.warn('[PostRepo] Fallback para memória ao criar post:', err)
      }
    }

    const newPost: PostEntity = {
      ...data,
      id: postId,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `h-${uuidv4().slice(0, 8)}`,
          postId,
          statusFrom: null,
          statusTo: data.status,
          changedBy: author,
          notes,
          timestamp: now,
        },
      ],
    }
    memoryPosts.unshift(newPost)
    return newPost
  },

  async update(id: string, patch: Partial<PostEntity>, author?: string, notes?: string): Promise<PostEntity> {
    const now = new Date()
    if (isDbConnected()) {
      try {
        const current = await prisma.post.findUnique({ where: { id } })
        if (!current) throw new Error('Post não encontrado')

        const { history: _h, demandId: _d, ...cleanPatch } = patch
        const isStatusChange = !!(cleanPatch.status && cleanPatch.status !== current.status)
        const post = await prisma.post.update({
          where: { id },
          data: {
            ...cleanPatch,
            updatedAt: now,
            ...(author
              ? {
                  history: {
                    create: {
                      statusFrom: isStatusChange ? current.status : current.status,
                      statusTo: patch.status || current.status,
                      changedBy: author,
                      notes: notes || (isStatusChange ? undefined : 'Conteúdo editado.'),
                      timestamp: now,
                    },
                  },
                }
              : {}),
          } as any,
          include: { history: { orderBy: { timestamp: 'asc' } } },
        })
        return post as unknown as PostEntity
      } catch (err) {
        console.warn('[PostRepo] Fallback para memória ao atualizar post:', err)
      }
    }

    const idx = memoryPosts.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Post não encontrado')
    const cur = memoryPosts[idx]
    const curHistory = cur.history || []

    let updatedHistory = [...curHistory]
    if (author) {
      updatedHistory.push({
        id: `h-${uuidv4().slice(0, 8)}`,
        postId: id,
        statusFrom: patch.status && patch.status !== cur.status ? cur.status : cur.status,
        statusTo: patch.status || cur.status,
        changedBy: author,
        notes: notes || (patch.status && patch.status !== cur.status ? undefined : 'Conteúdo editado.'),
        timestamp: now,
      })
    }

    const updated: PostEntity = {
      ...cur,
      ...patch,
      history: updatedHistory,
      updatedAt: now,
    }
    memoryPosts[idx] = updated
    return updated
  },
}

// ── MEDIA REPOSITORY ───────────────────────────────────────────────────────
export const MediaRepo = {
  async create(data: Omit<MediaEntity, 'id' | 'createdAt'>): Promise<MediaEntity> {
    const id = uuidv4()
    const now = new Date()
    if (isDbConnected()) {
      try {
        const m = await prisma.media.create({
          data: { ...data, id },
        })
        return m as MediaEntity
      } catch (err) {
        console.warn('[MediaRepo] Fallback para memória ao criar mídia:', err)
      }
    }
    const media: MediaEntity = { ...data, id, createdAt: now }
    memoryMedias.unshift(media)
    return media
  },

  async list(): Promise<MediaEntity[]> {
    if (isDbConnected()) {
      try {
        return (await prisma.media.findMany({ orderBy: { createdAt: 'desc' } })) as MediaEntity[]
      } catch (err) {
        console.warn('[MediaRepo] Fallback para memória ao listar mídia:', err)
      }
    }
    return [...memoryMedias]
  },
}

// ── N8N LOG REPOSITORY ─────────────────────────────────────────────────────
export const N8nLogRepo = {
  async create(data: Omit<N8nLogEntity, 'id' | 'timestamp'>): Promise<N8nLogEntity> {
    const id = `l-${uuidv4().slice(0, 8)}`
    const now = new Date()
    if (isDbConnected()) {
      try {
        const log = await prisma.n8nLog.create({
          data: {
            id,
            demandId: data.demandId,
            postId: data.postId,
            event: data.event,
            payload: data.payload,
            response: data.response,
            status: data.status,
            timestamp: now,
          },
        })
        return log as unknown as N8nLogEntity
      } catch (err) {
        console.warn('[N8nLogRepo] Fallback para memória ao criar log:', err)
      }
    }
    const log: N8nLogEntity = { ...data, id, timestamp: now }
    memoryLogs.unshift(log)
    return log
  },

  async list(): Promise<N8nLogEntity[]> {
    if (isDbConnected()) {
      try {
        return (await prisma.n8nLog.findMany({ orderBy: { timestamp: 'desc' } })) as unknown as N8nLogEntity[]
      } catch (err) {
        console.warn('[N8nLogRepo] Fallback para memória ao listar logs:', err)
      }
    }
    return [...memoryLogs].sort((a, b) => safeGetTime(b.timestamp) - safeGetTime(a.timestamp))
  },

  async findById(id: string): Promise<N8nLogEntity | null> {
    if (isDbConnected()) {
      try {
        return (await prisma.n8nLog.findUnique({ where: { id } })) as unknown as N8nLogEntity | null
      } catch (err) {
        console.warn('[N8nLogRepo] Fallback para memória ao buscar log:', err)
      }
    }
    return memoryLogs.find((l) => l.id === id) || null
  },

  async update(id: string, patch: Partial<N8nLogEntity>): Promise<N8nLogEntity> {
    if (isDbConnected()) {
      try {
        return (await prisma.n8nLog.update({
          where: { id },
          data: patch,
        })) as unknown as N8nLogEntity
      } catch (err) {
        console.warn('[N8nLogRepo] Fallback para memória ao atualizar log:', err)
      }
    }
    const idx = memoryLogs.findIndex((l) => l.id === id)
    if (idx === -1) throw new Error('Log não encontrado')
    memoryLogs[idx] = { ...memoryLogs[idx], ...patch }
    return memoryLogs[idx]
  },
}
