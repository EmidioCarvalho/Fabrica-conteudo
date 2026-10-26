import { AtSign } from 'lucide-react'
import type { DemandStatus, PostStatus, RouteTarget, SocialNetwork } from '../types'

type IconProps = { size?: number; className?: string }
type Icon = (p: IconProps) => JSX.Element

const brand = (path: string): Icon => ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d={path} />
  </svg>
)

// Ícones de marca em SVG (lucide-react removeu ícones de marcas nas versões recentes).
const Linkedin = brand('M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z')
const Instagram = brand('M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z')
const Facebook = brand('M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z')
const XIcon = brand('M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z')
const Youtube = brand('M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z')

export const NET_META: Record<SocialNetwork, { icon: Icon; color: string; bg: string }> = {
  LinkedIn: { icon: Linkedin, color: 'text-sky-700', bg: 'bg-sky-50' },
  Instagram: { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
  Facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  'X/Twitter': { icon: XIcon, color: 'text-slate-800', bg: 'bg-slate-100' },
  Threads: { icon: ({ size, className }) => <AtSign size={size} className={className} />, color: 'text-violet-700', bg: 'bg-violet-50' },
  'YouTube Shorts': { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
}

export const STATUS_META: Record<PostStatus, { dot: string; badge: string; bar: string }> = {
  Rascunho: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700', bar: '#94a3b8' },
  'Em revisão': { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-800', bar: '#facc15' },
  'Ajustes solicitados': { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700', bar: '#f97316' },
  Aprovado: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', bar: '#3b82f6' },
  Agendado: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700', bar: '#a855f7' },
  Publicado: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700', bar: '#22c55e' },
  Erro: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', bar: '#ef4444' },
  EM_REVISAO: { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-800', bar: '#facc15' },
  AJUSTES_SOLICITADOS: { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700', bar: '#f97316' },
  APROVADO: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', bar: '#3b82f6' },
  AGENDADO: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700', bar: '#a855f7' },
  PUBLICADO: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700', bar: '#22c55e' },
  ERRO: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', bar: '#ef4444' },
}

export const DEMAND_META: Record<DemandStatus, { label: string; dot: string; badge: string }> = {
  PENDENTE_EDITOR: { label: 'Aguardando Editor', dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-800' },
  EM_PRODUCAO: { label: 'Em produção', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
  EM_REVISAO: { label: 'Em revisão', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800' },
  AJUSTES_SOLICITADOS: { label: 'Ajustes solicitados', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' },
  ENVIADO_IA: { label: 'Enviado para IA (N8N)', dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700' },
  CONCLUIDO: { label: 'Concluído', dot: 'bg-green-500', badge: 'bg-green-50 text-green-700' },
  CANCELADO: { label: 'Cancelado', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
}

export const ROUTE_LABEL: Record<RouteTarget, string> = {
  EQUIPE_MARKETING: '👥 Equipe de Marketing',
  IA_N8N: '🤖 IA / Automação N8N',
}

export const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
export const fmtNum = (n: number) => n.toLocaleString('pt-BR')
