import { Outlet } from 'react-router'
import { BottomNav, PixelIcon } from '@/design/ui'

// E5 acrescenta "Simulados" e E6 acrescenta "Caderno".
const NAV = [
  { to: '/', label: 'Hoje', icon: <PixelIcon name="today" /> },
  { to: '/trilha', label: 'Trilha', icon: <PixelIcon name="trail" /> },
]

export function AppShell() {
  return (
    <div className="min-h-dvh pb-28">
      <Outlet />
      <BottomNav items={NAV} />
    </div>
  )
}
