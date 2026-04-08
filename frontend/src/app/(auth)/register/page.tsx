'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const apiBase = rawApiUrl.replace(/\/api\/?$/, '')

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'No se pudo crear la cuenta.')
        setLoading(false)
        return
      }

      const loginRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!loginRes?.ok) {
        router.push('/login')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Error de red al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nx-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg font-bold text-white">N</div>
          <span className="text-xl font-semibold">NexHost</span>
        </div>

        <div className="nx-card p-6 space-y-4">
          <div>
            <h1 className="text-base font-semibold">Crear cuenta</h1>
            <p className="text-sm text-nx-muted mt-1">Regístrate para entrar al panel</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              className="nx-input"
            />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="nx-input"
            />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Crea una contraseña"
              className="nx-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-60"
            >
              <UserPlus size={14} />
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-nx-muted mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-nx-accent hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
