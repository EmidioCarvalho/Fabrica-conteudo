import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { useStore } from './store/useStore'
import { canAccess, type Page } from './lib/rbac'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/ui'
import { HistoryModal, PostModal } from './components/PostModal'
import LoginScreen from './components/auth/LoginScreen'
import { AccessDenied } from './components/auth/RoleGuard'
import Requests from './pages/Requests'
import EditorQueue from './pages/EditorQueue'
import { RequestModal } from './components/RequestModal'
import EditorDashboard from './pages/EditorDashboard'
import Drafts from './pages/Drafts'
import ApprovalCenter from './pages/ApprovalCenter'
import Calendar from './pages/Calendar'
import Campaigns from './pages/Campaigns'
import Metrics from './pages/Metrics'
import { N8nPanel, SystemStatus, ExecutionLogs } from './pages/DevOps'
import ApiManagementView from './components/devops/ApiManagementView'

const PAGES: Record<Page, () => JSX.Element> = {
  dashboard: EditorDashboard, queue: EditorQueue, drafts: Drafts, requests: Requests, approval: ApprovalCenter, calendar: Calendar,
  campaigns: Campaigns, metrics: Metrics, n8n: N8nPanel, system: SystemStatus, logs: ExecutionLogs, api: ApiManagementView,
}

const DEVOPS_TABS: { label: string; pages: Page[]; go: Page }[] = [
  { label: 'Logs & Webhooks N8N', pages: ['n8n', 'logs'], go: 'n8n' },
  { label: 'Gestão de APIs e Credenciais', pages: ['api'], go: 'api' },
]

/** Abas do DevOps: 1) Logs & Webhooks N8N · 2) Gestão de APIs e Credenciais. */
function DevOpsTabs() {
  const { page, setPage } = useStore()
  return (
    <div role="tablist" className="mb-6 flex gap-1 border-b border-slate-200">
      {DEVOPS_TABS.map((t) => {
        const active = t.pages.includes(page)
        return (
          <button key={t.go} role="tab" aria-selected={active} id={`tab-${t.go}`} onClick={() => setPage(t.go)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-ink-900'}`}>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function App() {
  const { user, page, init } = useStore()
  useEffect(() => { init() }, [init])
  if (!user) return <><LoginScreen /><Toasts /></>
  const Page = canAccess(user.role, page) ? PAGES[page] : AccessDenied
  return (
    <Sidebar>
      {user.role === 'DEVOPS' && DEVOPS_TABS.some((t) => t.pages.includes(page)) && <DevOpsTabs />}
      <Page />
      <PostModal />
      <RequestModal />
      <HistoryModal />
      <Toasts />
    </Sidebar>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
