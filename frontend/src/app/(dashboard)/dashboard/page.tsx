'use client'
// src/app/(dashboard)/dashboard/page.tsx
import { useMe, useDomains, useNodeApps, useTickets } from '@/hooks/useApi'
import { Globe, Box, Database, Mail, ShieldCheck, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function DashboardPage() {
  const { data: me }      = useMe()
  const { data: domains } = useDomains()
  const { data: apps }    = useNodeApps()
  const { data: tickets } = useTickets()

  const openTickets = (tickets as any)?.filter((t: any) => t.status === 'open' || t.status === 'in_progress') || []

  const stats = [
    { label: 'Dominios',       value: domains?.length || 0, icon: <Globe size={16} />,     color: 'text-blue-400' },
    { label: 'Apps Node.js',   value: apps?.length || 0,    icon: <Box size={16} />,        color: 'text-green-400' },
    { label: 'Bases de datos', value: 0,                    icon: <Database size={16} />,   color: 'text-amber-400' },
    { label: 'Tickets abiertos',value: openTickets.length,  icon: <AlertCircle size={16} />,color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">
          Bienvenido, {me?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-nx-muted mt-1">
          Tu hosting está funcionando · Uptime 99.98%
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s: any) => (
          <div key={s.label} className="nx-card p-4">
            <div className={clsx('mb-2', s.color)}>{s.icon}</div>
            <div className={clsx('text-2xl font-semibold font-mono', s.color)}>{s.value}</div>
            <div className="text-xs text-nx-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Domains */}
      <div className="nx-card">
        <div className="nx-card-header">
          <h2 className="text-sm font-medium">Mis dominios</h2>
          <button className="btn-primary text-xs py-1.5 px-3">+ Agregar dominio</button>
        </div>
        <div>
          {domains?.length === 0 && (
            <p className="text-sm text-nx-muted px-4 py-6 text-center">
              No tienes dominios aún. ¡Agrega tu primero!
            </p>
          )}
          {domains?.map((d: any) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-nx-border last:border-0 hover:bg-white/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Globe size={14} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-mono font-medium">{d.domain}</p>
                <p className="text-xs text-nx-muted capitalize">{d.type} · PHP {d.php_version}</p>
              </div>
              {d.ssl_enabled && (
                <span className="text-[10px] flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 rounded px-2 py-0.5">
                  <ShieldCheck size={10} /> SSL
                </span>
              )}
              <span className={clsx(
                'text-[10px] w-1.5 h-1.5 rounded-full',
                d.status === 'active' ? 'bg-green-400' : 'bg-red-400'
              )} />
              <button className="btn-ghost">Administrar</button>
              <button className="btn-ghost">Archivos</button>
            </div>
          ))}
        </div>
      </div>

      {/* Apps */}
      <div className="nx-card">
        <div className="nx-card-header">
          <h2 className="text-sm font-medium">Apps Node.js</h2>
          <button className="btn-primary text-xs py-1.5 px-3">+ Nueva app</button>
        </div>
        <div>
          {apps?.length === 0 && (
            <p className="text-sm text-nx-muted px-4 py-6 text-center">No tienes apps Node.js.</p>
          )}
          {apps?.map((app: any) => (
            <div key={app.id} className="flex items-center gap-3 px-4 py-3 border-b border-nx-border last:border-0">
              <span className={clsx(
                'w-2 h-2 rounded-full',
                app.status === 'running' ? 'bg-green-400' : 'bg-red-400'
              )} />
              <div className="flex-1">
                <p className="text-sm font-medium">{app.name}</p>
                <p className="text-xs text-nx-muted font-mono">:{app.port} · Node {app.node_version}</p>
              </div>
              <span className={app.status === 'running' ? 'pill-running' : 'pill-stopped'}>
                {app.status === 'running' ? 'Corriendo' : 'Detenida'}
              </span>
              <button className="btn-ghost">Ver logs</button>
              <button className="btn-ghost">↺ Reiniciar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
