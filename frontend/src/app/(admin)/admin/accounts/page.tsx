'use client'

import Link from 'next/link'
import { useWhmAccounts } from '@/hooks/useApi'

export default function WhmAccountsPage() {
  const { data, isLoading } = useWhmAccounts()

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Enumerar las Cuentas</h1>
          <p className="text-sm text-nx-muted mt-1">Cuentas creadas por el panel maestro.</p>
        </div>
        <Link href="/admin/accounts/new" className="btn-primary">Crear cuenta</Link>
      </div>

      <div className="nx-card overflow-x-auto">
        <table className="nx-table min-w-[900px]">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Dominio</th>
              <th>Owner</th>
              <th>Reseller</th>
              <th>Estado</th>
              <th>Creada</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-nx-muted">Cargando cuentas...</td></tr>
            )}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={6} className="text-nx-muted">No hay cuentas todavía.</td></tr>
            )}
            {data?.map((item) => (
              <tr key={item.id}>
                <td>{item.username}</td>
                <td className="font-mono">{item.primaryDomain}</td>
                <td>{item.owner?.email || '-'}</td>
                <td>{item.reseller?.email || '-'}</td>
                <td>
                  <span className={
                    item.status === 'ACTIVE' ? 'pill-active' :
                    item.status === 'PROVISIONING' ? 'pill-pending' :
                    item.status === 'FAILED' ? 'pill-suspended' : 'pill-open'
                  }>
                    {item.status}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
