'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession()

  if (status === 'unauthenticated') redirect('/login')

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-nx-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-nx-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const role = String((session?.user as any)?.role || '').toLowerCase()
  if (!['admin', 'reseller'].includes(role)) redirect('/dashboard')

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '230px 1fr', gridTemplateRows: '52px 1fr' }}>
      <Topbar variant="admin" />
      <Sidebar variant="admin" />
      <main className="bg-nx-bg overflow-y-auto p-6">{children}</main>
    </div>
  )
}
