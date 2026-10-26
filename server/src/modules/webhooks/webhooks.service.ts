import { DemandRepo, N8nLogRepo, PostRepo } from '../../db/store'

export interface N8nCallbackPayload {
  event: 'content_generated' | 'published' | 'approval_rejected' | 'error' | string
  post_id?: string
  demand_id?: string
  route?: string
  social_content?: string
  image_url?: string
  raw_response?: any
  error?: string
}

export const WebhooksService = {
  async processN8nCallback(body: N8nCallbackPayload) {
    const { event, post_id, demand_id, social_content, image_url, error, raw_response } = body

    const postId = post_id
    const demandId = demand_id

    const post = postId ? await PostRepo.findById(postId) : null
    const demand = demandId ? await DemandRepo.findById(demandId) : null

    // 1. Trata cada tipo de evento do workflow
    if (event === 'content_generated' && post) {
      const patch: any = {
        caption: social_content || post.caption,
        status: 'Agendado',
      }
      if (image_url) patch.imageUrl = image_url

      await PostRepo.update(post.id, patch, 'N8N (automação)', 'Conteúdo e mídia gerados automaticamente pelo workflow N8N.')
      if (demand) {
        await DemandRepo.update(demand.id, { status: 'ENVIADO_IA' })
      }
    } else if (event === 'published' && post) {
      await PostRepo.update(post.id, { status: 'Publicado' }, 'N8N (automação)', 'Publicação efetuada com sucesso nas redes sociais.')
      if (demand) {
        await DemandRepo.update(demand.id, { status: 'CONCLUIDO' })
      }
    } else if (event === 'approval_rejected' && post) {
      const feedback = error || 'Reprovado ou sem resposta na aprovação humana.'
      await PostRepo.update(post.id, { status: 'Ajustes solicitados', rejectionFeedback: feedback }, 'N8N (aprovação Gmail)', feedback)
      if (demand) {
        await DemandRepo.update(demand.id, { status: 'AJUSTES_SOLICITADOS' })
      }
    } else if (event === 'error' && post) {
      const feedback = error || 'Falha na execução do workflow N8N.'
      await PostRepo.update(post.id, { status: 'Erro', rejectionFeedback: feedback }, 'N8N (automação)', feedback)
    }

    // 2. Grava log de auditoria
    const log = await N8nLogRepo.create({
      demandId: demandId || undefined,
      postId: postId || undefined,
      event: `callback.${event}`,
      payload: body,
      response: { processed: true, event },
      status: event === 'error' ? 'Failed' : 'Success',
    })

    return { success: true, event, logId: log.id }
  },
}
