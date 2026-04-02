'use client'
// src/app/(auth)/login/page.tsx
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Mail, Chrome } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await signIn('email', { email, redirect: false })
    setSent(true)
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

          {sent ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-green-400">
              ✓ Revisa tu correo — te enviamos un enlace mágico de acceso.
            </div>
          ) : (
            <>
              {/* Google */}
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center gap-2 bg-nx-bg3 border border-nx-border rounded-lg px-4 py-2.5 text-sm hover:border-nx-border2 transition-colors"
              >
                <Chrome size={15} className="text-blue-400" />
                Continuar con Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-nx-border" />
                <span className="text-xs text-nx-muted">o</span>
                <div className="flex-1 h-px bg-nx-border" />
              </div>

              {/* Email magic link */}
              <form onSubmit={handleEmail} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="nx-input"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-2.5 disabled:opacity-60"
                >
                  <Mail size={14} />
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-nx-muted mt-4">
          Al ingresar aceptas nuestros{' '}
          <a href="#" className="text-nx-accent hover:underline">Términos de servicio</a>
        </p>
      </div>
    </div>
  )
}
