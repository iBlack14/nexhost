'use client'

import { useWhmServiceStatus } from '@/hooks/useApi'

export default function WhmServicesPage() {
  const { data, isLoading } = useWhmServiceStatus()

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Estado del servicio</h1>
        <p className="text-sm text-nx-muted mt-1">Monitoreo en tiempo real del servidor.</p>
      </div>

      {isLoading && <p className="text-nx-muted">Cargando estado...</p>}

      {data && (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="nx-card p-4"><p>Nginx</p><p className="font-mono text-nx-accent">{data.nginx}</p></div>
          <div className="nx-card p-4"><p>MySQL</p><p className="font-mono text-nx-accent">{data.mysql}</p></div>
          <div className="nx-card p-4"><p>PostgreSQL</p><p className="font-mono text-nx-accent">{data.postgresql}</p></div>
          <div className="nx-card p-4"><p>PM2</p><p className="font-mono text-nx-accent">{data.pm2}</p></div>
          <div className="nx-card p-4"><p>CPU</p><p className="font-mono text-nx-accent">{data.cpuUsage}%</p></div>
          <div className="nx-card p-4"><p>RAM</p><p className="font-mono text-nx-accent">{data.ramUsage}%</p></div>
          <div className="nx-card p-4"><p>Disco</p><p className="font-mono text-nx-accent">{data.diskUsage}%</p></div>
          <div className="nx-card p-4"><p>Snapshot</p><p className="font-mono text-xs text-nx-muted">{new Date(data.capturedAt).toLocaleString()}</p></div>
        </div>
      )}
    </div>
  )
}
