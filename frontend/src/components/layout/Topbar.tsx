'use client'
// src/components/layout/Topbar.tsx
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Bell, Search } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  variant: 'client' | 'admin'
}

export default function Topbar({ variant }: Props) {
  const { data: session } = useSession()
  const isAdmin = variant === 'admin'

  return (
    <header
      className="col-span-2 bg-nx-bg2 border-b border-nx-border flex items-center px-5 gap-3"
      style={{ gridColumn: '1 / -1' }}
    >
      {/* Logo */}
      <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-[13px] font-bold text-white">
          N
        </div>
        <span className="font-semibold text-[15px] text-white">NexHost</span>
      </Link>

      {isAdmin && (
        <span className="text-[11px] bg-nx-bg3 border border-nx-border rounded-md px-2 py-0.5 text-nx-muted font-mono">
          Admin
        </span>
      )}

      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nx-muted" />
        <input
          className="nx-input pl-8 py-1.5 text-xs"
          placeholder={isAdmin ? 'Buscar usuario, dominio...' : 'Buscar dominio, app...'}
        />
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          <span className="text-xs text-nx-muted">Servidor activo</span>
        </div>
        <button className="text-nx-muted hover:text-white transition-colors relative">
          <Bell size={16} />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[11px] font-semibold">
          {session?.user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
