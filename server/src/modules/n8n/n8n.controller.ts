import { Router, Response } from 'express'
import { authGuard, AuthRequest } from '../auth/auth.middleware'
import { DemandRepo, N8nLogRepo, PostRepo } from '../../db/store'
import { N8nService } from './n8n.service'
import { getRecentEmails } from '../email/email.service'

export const n8nRouter = Router()

// GET /api/n8n/logs
n8nRouter.get('/logs', authGuard, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await N8nLogRepo.list()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao listar logs do N8N' })
  }
})

// POST /api/n8n/retry/:logId
n8nRouter.post('/retry/:logId', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { logId } = req.params
    const newLog = await N8nService.retry(logId)
    res.json(newLog)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao reprocessar webhook' })
  }
})

// POST /api/n8n/trigger
n8nRouter.post('/trigger', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.body
    if (!postId) {
      res.status(400).json({ error: 'postId é obrigatório' })
      return
    }

    const post = await PostRepo.findById(postId)
    if (!post) {
      res.status(404).json({ error: 'Post não encontrado' })
      return
    }

    const demand = post.demandId ? await DemandRepo.findById(post.demandId) : null
    const log = await N8nService.triggerWorkflow(post, demand)

    res.json({ success: log.status === 'Success', log })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao acionar N8N' })
  }
})

// POST /api/n8n/approve (Aprovação Web-First)
n8nRouter.post('/approve', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId, notes } = req.body
    if (!postId) {
      res.status(400).json({ error: 'postId é obrigatório' })
      return
    }

    const post = await PostRepo.findById(postId)
    if (!post) {
      res.status(404).json({ error: 'Post não encontrado' })
      return
    }

    const author = req.user?.name || 'Solicitante'
    const updatedPost = await PostRepo.update(
      postId,
      { status: 'Aprovado' },
      author,
      notes || 'Aprovado pelo Solicitante via Central de Aprovação Web.',
    )

    const demand = post.demandId ? await DemandRepo.findById(post.demandId) : null
    if (demand) {
      await DemandRepo.update(demand.id, { status: 'EM_PRODUCAO' }).catch(() => {})
      // Se a pauta tiver destino de IA/N8N, engatilha automaticamente a publicação
      if (demand.routeTarget === 'IA_N8N') {
        const log = await N8nService.triggerWorkflow(updatedPost, demand).catch((err) => {
          console.warn('[n8nRouter] Falha ao acionar publicação automática pós-aprovação:', err)
          return null
        })
        res.json({ success: true, post: updatedPost, log })
        return
      }
    }

    res.json({ success: true, post: updatedPost })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao processar aprovação' })
  }
})

// GET /api/n8n/emails (auditoria de e-mails transacionais enviados)
n8nRouter.get('/emails', authGuard, (_req: AuthRequest, res: Response): void => {
  res.json(getRecentEmails())
})
