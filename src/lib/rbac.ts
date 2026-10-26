import type { Role } from '../types'

export type Page =
  | 'dashboard' | 'queue' | 'drafts' | 'requests' | 'approval' | 'calendar' | 'campaigns' | 'metrics'
  | 'n8n' | 'system' | 'logs' | 'api'

export interface MenuItem { id: Page | 'newRequest'; label: string }

/** Menu e permissões de navegação por papel (RBAC). */
export const MENU: Record<Role, MenuItem[]> = {
  EDITOR: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'queue', label: 'Fila de Solicitações' },
    { id: 'drafts', label: 'Meus Rascunhos' },
    { id: 'calendar', label: 'Calendário Editorial' },
  ],
  SOLICITANTE: [
    { id: 'requests', label: 'Minhas Solicitações' },
    { id: 'newRequest', label: 'Nova Solicitação' },
    { id: 'approval', label: 'Central de Aprovação' },
    { id: 'calendar', label: 'Calendário Editorial' },
    { id: 'metrics', label: 'Métricas de Desempenho' },
    { id: 'campaigns', label: 'Campanhas' },
  ],
  DEVOPS: [
    { id: 'n8n', label: 'Logs & Webhooks N8N' },
    { id: 'system', label: 'Status do Sistema' },
    { id: 'logs', label: 'Logs de Execução' },
    { id: 'api', label: 'Gestão de APIs e Credenciais' },
  ],
}

export const HOME: Record<Role, Page> = { EDITOR: 'dashboard', SOLICITANTE: 'requests', DEVOPS: 'n8n' }

export const ROLE_LABEL: Record<Role, string> = { EDITOR: 'Editor', SOLICITANTE: 'Solicitante', DEVOPS: 'DevOps' }

export const canAccess = (role: Role, page: Page) => MENU[role].some((m) => m.id === page)

export type Permission = 'demand:create' | 'demand:claim' | 'post:edit' | 'post:review' | 'post:publishManual' | 'webhook:retry'

const PERMS: Record<Role, Permission[]> = {
  EDITOR: ['demand:claim', 'post:edit', 'post:publishManual'],
  SOLICITANTE: ['demand:create', 'post:review'],
  DEVOPS: ['webhook:retry'],
}
export const can = (role: Role, p: Permission) => PERMS[role].includes(p)
