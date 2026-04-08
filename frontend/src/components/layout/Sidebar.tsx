'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import clsx from 'clsx'
import {
  LayoutDashboard, Globe, Box, Database, Mail,
  ShieldCheck, Clock, FileText, Settings,
  CreditCard, MessageSquare, UserPlus, Activity, ListChecks, LogOut,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  href:  string
  label: string
  icon:  React.ReactNode
  badge?: number
}

interface Props {
  variant: 'client' | 'admin'
  diskUsedMb?: number
  diskGb?:     number
}

export default function Sidebar({ variant, diskUsedMb = 0, diskGb = 10 }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const clientNav: NavItem[] = [
    { href: '/dashboard',   label: 'Inicio',         icon: <LayoutDashboard size={15} /> },
    { href: '/domains',     label: 'Mis dominios',   icon: <Globe size={15} /> },
    { href: '/apps',        label: 'Aplicaciones',   icon: <Box size={15} /> },
    { href: '/databases',   label: 'Bases de datos', icon: <Database size={15} /> },
    { href: '/email',       label: 'Correos',        icon: <Mail size={15} /> },
    { href: '/ssl',         label: 'SSL',            icon: <ShieldCheck size={15} /> },
    { href: '/backups',     label: 'Backups',        icon: <Clock size={15} /> },
  ]

  const adminNav: NavItem[] = [
    { href: '/admin',               label: 'WHM Home',           icon: <LayoutDashboard size={15} /> },
    { href: '/admin/accounts',      label: 'Enumerar cuentas',   icon: <ListChecks size={15} /> },
    { href: '/admin/accounts/new',  label: 'Crear cuenta',       icon: <UserPlus size={15} /> },
    { href: '/admin/dns',           label: 'DNS Zone Manager',   icon: <Globe size={15} /> },
    { href: '/admin/services',      label: 'Estado del servicio',icon: <Activity size={15} /> },
  ]

  const bottomNav: NavItem[] = variant === 'client'
    ? [
        { href: '/support',  label: 'Soporte',      icon: <MessageSquare size={15} /> },
        { href: '/docs',     label: 'Documentación',icon: <FileText size={15} /> },
        { href: '/settings', label: 'Configuración',icon: <Settings size={15} /> },
        { href: '/billing',  label: 'Facturación',  icon: <CreditCard size={15} /> },
      ]
    : [
        { href: '/admin/settings',label: 'Configuración',icon: <Settings size={15} /> },
        { href: '/support',       label: 'Soporte',      icon: <MessageSquare size={15} /> },
      ]

  const nav = variant === 'admin' ? adminNav : clientNav
  const diskPct = Math.round((diskUsedMb / 1024) / diskGb * 100)

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href))
    return (
      <Link href={item.href}
        className={clsx('nav-item', active && 'nav-item-active')}>
        {item.icon}
        <span className="flex-1">{item.label}</span>
        {item.badge ? (
          <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{item.badge}</span>
        ) : active ? (
          <ChevronRight size={12} className="text-nx-accent opacity-60" />
        ) : null}
      </Link>
    )
  }

  return (
    <aside className="bg-nx-bg2 border-r border-nx-border flex flex-col py-4">
      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        <p className="text-[10px] uppercase tracking-widest text-nx-muted px-4 pb-1 pt-1 font-medium">
          {variant === 'admin' ? 'Administración' : 'Mi cuenta'}
        </p>
        {nav.map(item => <NavLink key={item.href} item={item} />)}

        <p className="text-[10px] uppercase tracking-widest text-nx-muted px-4 pb-1 pt-4 font-medium">
          {variant === 'admin' ? 'Sistema' : 'Soporte'}
        </p>
        {bottomNav.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Footer */}
      <div className="px-3 pt-3 border-t border-nx-border space-y-3">
        {/* Disk usage (client only) */}
        {variant === 'client' && (
          <div className="bg-nx-bg3 border border-nx-border rounded-xl p-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] text-nx-muted">Almacenamiento</span>
              <span className="text-[11px] text-white font-mono">
                {(diskUsedMb / 1024).toFixed(1)} / {diskGb} GB
              </span>
            </div>
            <div className="h-1 bg-nx-bg2 rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-nx-accent to-nx-accent2 transition-all"
                style={{ width: `${Math.min(diskPct, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-nx-muted mt-1">{diskPct}% usado</p>
          </div>
        )}

        {/* User info + logout */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{session?.user?.name}</p>
            <p className="text-[10px] text-nx-muted truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-nx-muted hover:text-red-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
