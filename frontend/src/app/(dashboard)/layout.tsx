'use client'
// src/app/(dashboard)/layout.tsx
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar  from '@/components/layout/Topbar'
import { useMe } from '@/hooks/useApi'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'unauthenticated') redirect('/login')
  if (status === 'loading') return (
    <div className="min-h-screen bg-nx-bg flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-nx-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return <DashboardShell>{children}</DashboardShell>
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: me } = useMe()

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '210px 1fr', gridTemplateRows: '52px 1fr' }}>
      <Topbar variant="client" />
      <Sidebar
        variant="client"
        diskUsedMb={me?.disk_used_mb}
        diskGb={me?.disk_gb}
      />
      <main className="bg-nx-bg overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
