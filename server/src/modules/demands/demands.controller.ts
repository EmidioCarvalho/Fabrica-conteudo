import { Router, Response } from 'express'
import { authGuard, AuthRequest } from '../auth/auth.middleware'
import { DemandRepo, PostRepo } from '../../db/store'
import { N8nService } from '../n8n/n8n.service'

export const demandsRouter = Router()

// GET /api/demands
demandsRouter.get('/', authGuard, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await DemandRepo.list()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao listar demandas' })
  }
})

// POST /api/demands
demandsRouter.post('/', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, briefing, targetNetwork, desiredDate, routeTarget } = req.body
    if (!title || !briefing) {
      res.status(400).json({ error: 'Título e briefing são obrigatórios.' })
      return
    }

    const requestedById = req.user?.id || 'u-solicitante'
    const isIa = routeTarget === 'IA_N8N'

    const demand = await DemandRepo.create({
      title,
      briefing,
      targetNetwork: targetNetwork || 'LinkedIn',
      desiredDate,
      routeTarget: routeTarget || 'EQUIPE_MARKETING',
      status: isIa ? 'ENVIADO_IA' : 'PENDENTE_EDITOR',
      requestedById,
      assignedEditorId: null,
    })

    // Se a rota for IA_N8N, cria o post automaticamente e aciona a esteira do N8N
    if (isIa) {
      const post = await PostRepo.create(
        {
          demandId: demand.id,
          title: demand.title,
          caption: demand.briefing,
          socialNetwork: demand.targetNetwork,
          scheduledDate: demand.desiredDate,
          scheduledTime: '10:00',
          editorId: 'n8n',
          status: 'Agendado',
          cta: '',
          hashtags: '',
        },
        'N8N (automação)',
        'Post gerado e agendado pela automação N8N a partir do briefing.',
      )

      // Dispara webhook assíncrono para o N8N
      N8nService.triggerWorkflow(post, demand).catch((e) =>
        console.error('[DemandsController] Falha no disparo N8N:', e),
      )
    }

    res.status(201).json(demand)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao criar demanda' })
  }
})

// PATCH /api/demands/:id
demandsRouter.patch('/:id', authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const patch = req.body
    const updated = await DemandRepo.update(id, patch)
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar demanda' })
  }
})
