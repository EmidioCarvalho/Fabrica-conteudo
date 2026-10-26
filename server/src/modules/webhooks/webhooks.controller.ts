import { Router, Request, Response } from 'express'
import { ENV } from '../../config/env'
import { WebhooksService } from './webhooks.service'

export const webhooksRouter = Router()

// POST /api/webhooks/n8n/callback
webhooksRouter.post('/n8n/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = req.headers['x-fabrica-secret']
    if (secret !== ENV.N8N_SHARED_SECRET) {
      res.status(401).json({ error: 'Assinatura inválida (x-fabrica-secret incorreto).' })
      return
    }

    const result = await WebhooksService.processN8nCallback(req.body)
    res.json(result)
  } catch (err: any) {
    console.error('[WebhooksController] Erro:', err)
    res.status(500).json({ error: err.message || 'Erro ao processar callback' })
  }
})
