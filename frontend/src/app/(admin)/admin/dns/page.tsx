'use client'

import { useState } from 'react'
import { useCreateWhmDnsRecord, useWhmDnsZones } from '@/hooks/useApi'

export default function WhmDnsPage() {
  const { data, isLoading } = useWhmDnsZones()
  const createRecord = useCreateWhmDnsRecord()
  const [recordForm, setRecordForm] = useState({
    zoneId: '',
    type: 'A' as 'A' | 'CNAME' | 'TXT',
    name: '@',
    content: '',
    ttl: 300,
    proxied: false,
  })

  const submitRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    await createRecord.mutateAsync(recordForm)
    setRecordForm({ ...recordForm, content: '' })
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold">DNS Zone Manager</h1>
        <p className="text-sm text-nx-muted mt-1">
          {data?.cloudflareConfigured ? 'Cloudflare conectado' : 'Cloudflare no configurado (modo local)'}
        </p>
      </div>

      <form onSubmit={submitRecord} className="nx-card p-4 grid md:grid-cols-6 gap-2">
        <select className="nx-input md:col-span-2" value={recordForm.zoneId} onChange={(e) => setRecordForm({ ...recordForm, zoneId: e.target.value })} required>
          <option value="">Selecciona zona</option>
          {data?.zones.map((zone) => (
            <option key={zone.id} value={zone.id}>{zone.domain}</option>
          ))}
        </select>
        <select className="nx-input" value={recordForm.type} onChange={(e) => setRecordForm({ ...recordForm, type: e.target.value as any })}>
          <option value="A">A</option>
          <option value="CNAME">CNAME</option>
          <option value="TXT">TXT</option>
        </select>
        <input className="nx-input" placeholder="name" value={recordForm.name} onChange={(e) => setRecordForm({ ...recordForm, name: e.target.value })} />
        <input className="nx-input md:col-span-2" placeholder="content" value={recordForm.content} onChange={(e) => setRecordForm({ ...recordForm, content: e.target.value })} required />
        <button className="btn-primary md:col-span-6 w-fit" disabled={createRecord.isPending}>Crear registro</button>
      </form>

      <div className="space-y-3">
        {isLoading && <p className="text-nx-muted">Cargando zonas...</p>}
        {data?.zones.map((zone) => (
          <div key={zone.id} className="nx-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{zone.domain}</h2>
              <span className="text-xs text-nx-muted">{zone.syncStatus}</span>
            </div>
            <div className="mt-3 space-y-1">
              {zone.records.length === 0 && <p className="text-sm text-nx-muted">Sin registros todavía.</p>}
              {zone.records.map((record) => (
                <div key={record.id} className="text-sm flex items-center justify-between border border-nx-border rounded px-2 py-1">
                  <span className="font-mono">{record.type} {record.name} → {record.content}</span>
                  <span className="text-xs text-nx-muted">{record.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
