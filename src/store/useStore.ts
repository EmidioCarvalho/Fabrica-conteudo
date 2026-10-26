import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as api from '../services/api'
import { HOME, canAccess, type Page } from '../lib/rbac'
import type { DemandStatus, N8nLog, Post, PostStatus, PublicationDemand, User } from '../types'

export type { Page }
export interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string }
export type NewDemand = Pick<PublicationDemand, 'title' | 'briefing' | 'targetNetwork' | 'desiredDate' | 'routeTarget'>

const DEMAND_OF: Partial<Record<PostStatus, DemandStatus>> = {
  Rascunho: 'EM_PRODUCAO',
  'Em revisão': 'EM_REVISAO',
  'Ajustes solicitados': 'AJUSTES_SOLICITADOS',
  Aprovado: 'EM_PRODUCAO',
  Agendado: 'ENVIADO_IA',
  Erro: 'ENVIADO_IA',
  Publicado: 'CONCLUIDO',
}

interface State {
  user: User | null
  demands: PublicationDemand[]
  posts: Post[]
  logs: N8nLog[]
  loading: boolean
  page: Page
  toasts: Toast[]
  editor: { open: boolean; postId: string | null }
  requestOpen: boolean
  historyPostId: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; unverified?: boolean; email?: string; error?: string }>
  register: (data: { name: string; email: string; password: string; role: 'SOLICITANTE' | 'EDITOR' | 'DEVOPS' }) => Promise<{ success: boolean; message?: string; error?: string }>
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; message?: string; error?: string }>
  resendCode: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>
  logout: () => Promise<void>
  init: () => Promise<void>
  setPage: (p: Page) => void
  toast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: number) => void
  openEditor: (postId: string) => void
  closeEditor: () => void
  openRequest: () => void
  closeRequest: () => void
  createDemand: (d: NewDemand) => Promise<void>
  cancelDemand: (id: string) => Promise<void>
  claimDemand: (id: string) => Promise<void>
  showHistory: (id: string | null) => void
  savePost: (data: Omit<Post, 'id' | 'history' | 'updatedAt' | 'metrics'>, id: string) => Promise<void>
  moveStatus: (id: string, status: PostStatus, notes?: string) => Promise<void>
  approvePost: (id: string) => Promise<void>
  retryLog: (logId: string) => Promise<void>
  resetDemo: () => Promise<void>
}

let toastSeq = 1

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const authorName = () => get().user?.name ?? 'Sistema'
      const enter = (user: User) => {
        set({ user, page: HOME[user.role] })
        get().toast(`Bem-vindo(a), ${user.name}!`, 'info')
      }
      const replace = (p: Post) => set((s) => ({ posts: s.posts.map((x) => (x.id === p.id ? p : x)) }))
      const syncDemand = async (id: string, patch: Partial<Pick<PublicationDemand, 'status' | 'assignedEditorId'>>) => {
        try {
          const d = await api.updateDemand(id, patch)
          set((s) => ({ demands: s.demands.map((x) => (x.id === id ? d : x)) }))
        } catch { /* erro silencioso */ }
      }

      return {
        user: null, demands: [], posts: [], logs: [], loading: true,
        page: 'dashboard', toasts: [],
        editor: { open: false, postId: null }, requestOpen: false, historyPostId: null,

        login: async (email, password) => {
          try {
            const { user } = await api.login(email, password)
            enter(user)
            await get().init()
            return { success: true }
          } catch (err: any) {
            if (err.data?.emailVerified === false) {
              return { success: false, unverified: true, email: err.data.email || email, error: err.message }
            }
            return { success: false, error: err.message || 'E-mail ou senha inválidos' }
          }
        },

        register: async (data) => {
          try {
            const res = await api.register(data)
            return { success: true, message: res.message }
          } catch (err: any) {
            return { success: false, error: err.message || 'Erro ao realizar cadastro' }
          }
        },

        verifyEmail: async (email, code) => {
          try {
            const res = await api.verifyEmail(email, code)
            return { success: true, message: res.message }
          } catch (err: any) {
            return { success: false, error: err.message || 'Código de verificação inválido' }
          }
        },

        resendCode: async (email) => {
          try {
            const res = await api.resendCode(email)
            return { success: true, message: res.message }
          } catch (err: any) {
            return { success: false, error: err.message || 'Erro ao reenviar código' }
          }
        },

        logout: async () => {
          await api.logout()
          set({ user: null, editor: { open: false, postId: null }, requestOpen: false, historyPostId: null })
        },

        init: async () => {
          set({ loading: true })
          try {
            const [demands, posts, logs] = await Promise.all([
              api.getDemands().catch(() => []),
              api.getPosts().catch(() => []),
              api.getN8nLogs().catch(() => []),
            ])
            set({ demands, posts, logs, loading: false })
          } catch {
            set({ loading: false })
          }
        },

        setPage: (page) => {
          const u = get().user
          set({ page: u && !canAccess(u.role, page) ? HOME[u.role] : page })
        },

        toast: (message, type = 'success') => {
          const id = toastSeq++
          set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
          setTimeout(() => get().dismissToast(id), 3800)
        },

        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        openEditor: (postId) => set({ editor: { open: true, postId } }),
        closeEditor: () => set({ editor: { open: false, postId: null } }),
        openRequest: () => set({ requestOpen: true }),
        closeRequest: () => set({ requestOpen: false }),
        showHistory: (historyPostId) => set({ historyPostId }),

        createDemand: async (data) => {
          const user = get().user
          if (!user) return
          try {
            const demand = await api.createDemand({
              ...data,
              requestedBy: user.id,
              status: data.routeTarget === 'IA_N8N' ? 'ENVIADO_IA' : 'PENDENTE_EDITOR',
            })
            set((s) => ({ demands: [demand, ...s.demands] }))

            // Se for rota IA, recarrega posts e logs atualizados pelo backend
            if (data.routeTarget === 'IA_N8N') {
              get().toast('Solicitação enviada e acionada no workflow N8N!')
              const [posts, logs] = await Promise.all([api.getPosts(), api.getN8nLogs()])
              set({ posts, logs })
            } else {
              get().toast('Solicitação enviada para a Equipe de Marketing!')
            }
          } catch (err: any) {
            get().toast(err.message || 'Erro ao criar a solicitação', 'error')
          }
        },

        cancelDemand: async (id) => {
          await syncDemand(id, { status: 'CANCELADO' })
          get().toast('Solicitação cancelada', 'info')
        },

        claimDemand: async (id) => {
          const user = get().user
          const demand = get().demands.find((d) => d.id === id)
          if (!user || !demand) return
          try {
            const post = await api.createPost(
              {
                demandId: demand.id,
                title: demand.title,
                caption: '',
                imageUrl: '',
                cta: '',
                hashtags: '',
                socialNetwork: demand.targetNetwork,
                scheduledDate: demand.desiredDate,
                scheduledTime: '10:00',
                editorId: user.id,
                status: 'Rascunho',
              },
              user.name,
              'Solicitação assumida pelo Editor.',
            )
            set((s) => ({ posts: [post, ...s.posts] }))
            await syncDemand(id, { status: 'EM_PRODUCAO', assignedEditorId: user.id })
            get().toast('Solicitação assumida! Rascunho criado.')
            get().openEditor(post.id)
          } catch (err: any) {
            get().toast(err.message || 'Não foi possível assumir a solicitação', 'error')
          }
        },

        savePost: async (data, id) => {
          try {
            const payload = data.status === 'Em revisão' ? { ...data, rejectionFeedback: undefined } : data
            const saved = await api.updatePost(id, payload, authorName())
            replace(saved)
            const demandStatus = DEMAND_OF[saved.status]
            if (data.status === 'Em revisão' && demandStatus) await syncDemand(saved.demandId, { status: demandStatus })
            get().toast(data.status === 'Em revisão' ? 'Post enviado para revisão!' : 'Rascunho salvo com sucesso')
          } catch (err: any) {
            get().toast(err.message || 'Erro ao salvar a publicação', 'error')
          }
        },

        moveStatus: async (id, status, notes) => {
          try {
            const extra: Partial<Post> = status === 'Ajustes solicitados' ? { rejectionFeedback: notes } : status === 'Em revisão' ? { rejectionFeedback: undefined } : {}
            const updated = await api.updatePostStatus(id, status, authorName(), notes, extra)
            replace(updated)
            const demandStatus = DEMAND_OF[status]
            if (demandStatus) await syncDemand(updated.demandId, { status: demandStatus })
            const msgs: Partial<Record<PostStatus, string>> = {
              'Em revisão': 'Post enviado para revisão!',
              'Ajustes solicitados': 'Ajustes solicitados. O post voltou para a fila do Editor.',
              Aprovado: 'Post aprovado! Encaminhado para publicação.',
              Publicado: 'Post marcado como publicado!',
            }
            get().toast(msgs[status] ?? `"${updated.title}" → ${status}`)
          } catch (err: any) {
            get().toast(err.message || 'Não foi possível atualizar o status', 'error')
          }
        },

        approvePost: async (id) => {
          try {
            const res = await api.notifyApproval(id, 'Aprovado pelo Solicitante via Central de Aprovação Web.')
            if (res.post) {
              replace(res.post)
            } else {
              await get().moveStatus(id, 'Aprovado', 'Aprovado pelo Solicitante. Encaminhado para publicação.')
            }
            if (res.log) {
              set((s) => ({ logs: [res.log!, ...s.logs] }))
            }
            get().toast('Post aprovado com sucesso! Fluxo de publicação liberado.')
          } catch {
            await get().moveStatus(id, 'Aprovado', 'Aprovado pelo Solicitante.')
          }
        },

        retryLog: async (logId) => {
          try {
            const updated = await api.retryN8nLog(logId)
            set((s) => ({ logs: s.logs.map((l) => (l.id === logId ? updated : l)) }))
            const posts = await api.getPosts()
            set({ posts })
            get().toast('Webhook reprocessado com sucesso!')
          } catch (err: any) {
            get().toast(err.message || 'Falha ao reprocessar', 'error')
          }
        },

        resetDemo: async () => {
          await get().init()
          get().toast('Dados atualizados a partir do banco', 'info')
        },
      }
    },
    { name: 'fabrica:session', version: 4, migrate: () => ({ user: null as User | null, page: 'dashboard' as Page }), partialize: (s) => ({ user: s.user, page: s.page }) },
  ),
)
