import type { Post, StatusHistory } from '../types'

/** Último comentário de "Ajustes solicitados" feito pelo Solicitante. */
export function latestFeedback(post: Post): StatusHistory | undefined {
  if (post.status !== 'Ajustes solicitados') return undefined
  return [...post.history].reverse().find((h) => h.statusTo === 'Ajustes solicitados')
}

export const isEditable = (post: Post) => post.status === 'Rascunho' || post.status === 'Ajustes solicitados'
