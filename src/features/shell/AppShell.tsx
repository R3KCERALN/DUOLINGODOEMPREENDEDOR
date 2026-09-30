import { Outlet } from 'react-router'
import { BottomNav, PixelIcon } from '@/design/ui'

// E6 acrescenta "Caderno".
const NAV = [
  { to: '/', label: 'Hoje', icon: <PixelIcon name="today" /> },
  { to: '/trilha', label: 'Trilha', icon: <PixelIcon name="trail" /> },
  { to: '/simulados', label: 'Simulados', icon: <PixelIcon name="reels" /> },
]

export function AppShell() {
  return (
    <div className="min-h-dvh pb-28">
      <Outlet />
      <BottomNav items={NAV} />
    </div>
  )
}
