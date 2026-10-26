import { Router, Response } from 'express'
import { authGuard, AuthRequest } from '../auth/auth.middleware'
import { DemandRepo, PostRepo } from '../../db/store'

export const postsRouter = Router()

const DEMAND_OF: Record<string, string> = {
  Rascunho: 'EM_PRODUCAO',
  RASCUNHO: 'EM_PRODUCAO',
  'Em revisão': 'EM_REVISAO',
  EM_REVISAO: 'EM_REVISAO',
  'Ajustes solicitados': 'AJUSTES_SOLICITADOS',
  AJUSTES_SOLICITADOS: 'AJUSTES_SOLICITADOS',
  Aprovado: 'EM_PRODUCAO',
  APROVADO: 'EM_PRODUCAO',
  Agendado: 'ENVIADO_IA',
  AGENDADO: 'ENVIADO_IA',
  Erro: 'ENVIADO_IA',
  ERRO: 'ENVIADO_IA',
  Publicado: 'CONCLUIDO',
  PUBLICADO: 'CONCLUIDO',
}

// GET /api/posts
postsRouter.get('/', authGuard, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await PostRepo.list()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao listar posts' })
  }
})

// POST /api/posts
postsRouter.post('/', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body
    const author = req.user?.name || 'Sistema'
    const post = await PostRepo.create(data, author, data.notes || 'Publicação criada.')

    // Se estiver associado a demanda, atualiza status da demanda
    if (post.demandId && DEMAND_OF[post.status]) {
      await DemandRepo.update(post.demandId, {
        status: DEMAND_OF[post.status],
        assignedEditorId: post.editorId || undefined,
      }).catch(() => {})
    }

    res.status(201).json(post)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao criar post' })
  }
})

// PUT /api/posts/:id
postsRouter.put('/:id', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const patch = req.body
    const author = req.user?.name || 'Sistema'
    const updated = await PostRepo.update(id, patch, author)

    if (updated.demandId && patch.status && DEMAND_OF[patch.status]) {
      await DemandRepo.update(updated.demandId, { status: DEMAND_OF[patch.status] }).catch(() => {})
    }

    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar post' })
  }
})

// PATCH /api/posts/:id/status
postsRouter.patch('/:id/status', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, notes, rejectionFeedback } = req.body
    const author = req.user?.name || 'Sistema'

    const patch: any = { status }
    if (rejectionFeedback !== undefined) {
      patch.rejectionFeedback = rejectionFeedback
    }

    const updated = await PostRepo.update(id, patch, author, notes)

    if (updated.demandId && DEMAND_OF[status]) {
      await DemandRepo.update(updated.demandId, { status: DEMAND_OF[status] }).catch(() => {})
    }

    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao alterar status do post' })
  }
})
