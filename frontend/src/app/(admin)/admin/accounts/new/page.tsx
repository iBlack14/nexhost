'use client'

import { useState } from 'react'
import { useCreateWhmAccount, useProvisionJob } from '@/hooks/useApi'

export default function NewWhmAccountPage() {
  const createAccount = useCreateWhmAccount()
  const [jobId, setJobId] = useState<string>()
  const { data: job } = useProvisionJob(jobId)

  const [form, setForm] = useState({
    username: '',
    primaryDomain: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    planName: 'starter',
    enableSSL: true,
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const created = await createAccount.mutateAsync(form)
    setJobId(created.jobId)
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Crear una nueva cuenta</h1>
        <p className="text-sm text-nx-muted mt-1">Crea cuenta tipo cPanel y ejecuta provisión automática.</p>
      </div>

      <form onSubmit={onSubmit} className="nx-card p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input className="nx-input" placeholder="username (linux)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input className="nx-input" placeholder="dominio principal" value={form.primaryDomain} onChange={(e) => setForm({ ...form, primaryDomain: e.target.value })} required />
          <input className="nx-input" placeholder="nombre del cliente" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
          <input className="nx-input" placeholder="email del cliente" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} required />
          <input className="nx-input" type="password" placeholder="password cliente (opcional)" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} />
          <input className="nx-input" placeholder="plan (starter/pro/business)" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} />
        </div>

        <label className="flex items-center gap-2 text-sm text-nx-muted">
          <input type="checkbox" checked={form.enableSSL} onChange={(e) => setForm({ ...form, enableSSL: e.target.checked })} />
          Intentar emitir SSL automáticamente
        </label>

        <button className="btn-primary" disabled={createAccount.isPending}>
          {createAccount.isPending ? 'Encolando...' : 'Crear y aprovisionar'}
        </button>
      </form>

      {jobId && (
        <div className="nx-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Job de provisión</h2>
            <span className="pill-open">{job?.status || 'PENDING'}</span>
          </div>
          <p className="text-xs text-nx-muted font-mono">Job ID: {jobId}</p>
          <div className="space-y-2">
            {job?.steps?.map((step) => (
              <div key={step.id} className="flex items-center justify-between border border-nx-border rounded-lg p-2">
                <span className="text-sm">{step.step}</span>
                <span className="text-xs text-nx-muted">{step.status}</span>
              </div>
            ))}
          </div>
          {job?.error && <p className="text-red-300 text-sm">{job.error}</p>}
        </div>
      )}
    </div>
  )
}
