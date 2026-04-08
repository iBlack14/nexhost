'use client'
// src/app/(auth)/login/page.tsx
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-nx-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg font-bold text-white">N</div>
          <span className="text-xl font-semibold">NexHost</span>
        </div>

        <div className="nx-card p-6 space-y-4">
          <div>
            <h1 className="text-base font-semibold">Iniciar sesión</h1>
            <p className="text-sm text-nx-muted mt-1">Accede a tu panel de hosting</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
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
              placeholder="Tu contraseña"
              className="nx-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-60"
            >
              <LogIn size={14} />
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-nx-muted mt-4">
          Al ingresar aceptas nuestros{' '}
          <a href="#" className="text-nx-accent hover:underline">Términos de servicio</a>
        </p>
      </div>
    </div>
  )
}
