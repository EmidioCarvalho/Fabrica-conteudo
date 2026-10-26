import { ENV } from '../../config/env'
import { DemandEntity, N8nLogRepo, PostEntity, PostRepo } from '../../db/store'
import { buildPollinationsImagePrompt } from './prompts'

export function mapNetworkToRoute(network: string): 'xtwitter' | 'linkedin' | 'instagram' | 'facebook' | 'threads' | 'youtube_shorts' {
  const norm = (network || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (norm.includes('twitter') || norm === 'x' || norm.includes('xtwitter')) return 'xtwitter'
  if (norm.includes('linkedin')) return 'linkedin'
  if (norm.includes('instagram')) return 'instagram'
  if (norm.includes('facebook')) return 'facebook'
  if (norm.includes('threads')) return 'threads'
  if (norm.includes('youtube') || norm.includes('shorts')) return 'youtube_shorts'
  return 'linkedin'
}

export const N8nService = {
  async triggerWorkflow(post: PostEntity, demand?: DemandEntity | null) {
    const route = mapNetworkToRoute(post.socialNetwork)

    // Formata timestamp ISO-8601 para agendamento
    let scheduledAt = new Date().toISOString()
    if (post.scheduledDate) {
      const time = post.scheduledTime || '10:00'
      const dt = new Date(`${post.scheduledDate}T${time}:00`)
      if (!isNaN(dt.getTime())) {
        scheduledAt = dt.toISOString()
      }
    }

    const briefing = demand?.briefing || post.caption || post.title
    const payload = {
      route,
      user_prompt: briefing,
      title: post.title,
      caption: post.caption || '',
      media_url: post.imageUrl || '',
      cta: post.cta || '',
      scheduled_at: scheduledAt,
      demand_id: post.demandId,
      post_id: post.id,
      image_prompt: buildPollinationsImagePrompt(briefing, post.theme || undefined),
    }

    let responseData: any = null
    let isSuccess = false

    try {
      const res = await fetch(ENV.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fabrica-secret': ENV.N8N_SHARED_SECRET,
        },
        body: JSON.stringify(payload),
      })

      const status = res.status
      let text = await res.text()
      try {
        responseData = JSON.parse(text)
      } catch {
        responseData = { status, raw: text }
      }

      isSuccess = status >= 200 && status < 300
    } catch (err: any) {
      console.error('[N8nService] Erro ao disparar webhook N8N:', err)
      responseData = {
        error: err.message || 'Falha de conexão com o orquestrador N8N',
        url: ENV.N8N_WEBHOOK_URL,
      }
      isSuccess = false
    }

    // Registra log na tabela n8n_logs
    const log = await N8nLogRepo.create({
      demandId: post.demandId,
      postId: post.id,
      event: 'webhook.publish',
      payload: {
        endpoint: ENV.N8N_WEBHOOK_URL,
        headers: { 'x-fabrica-secret': '***' },
        request: payload,
      },
      response: responseData,
      status: isSuccess ? 'Success' : 'Failed',
    })

    return log
  },

  async retry(logId: string) {
    const log = await N8nLogRepo.findById(logId)
    if (!log) throw new Error('Log não encontrado')

    const post = log.postId ? await PostRepo.findById(log.postId) : null
    if (!post) throw new Error('Post associado ao log não foi encontrado')

    // Dispara novamente
    const newLog = await this.triggerWorkflow(post)
    return newLog
  },
}
