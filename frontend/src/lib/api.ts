// src/lib/api.ts
import axios from 'axios'
import { getSession } from 'next-auth/react'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  timeout: 15000,
})

// Adjunta el JWT de NextAuth a cada request
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session) {
    // Usamos el token de sesión como Bearer
    const token = (session as any).accessToken || btoa(JSON.stringify({
      email: session.user?.email,
      role:  (session.user as any)?.role,
    }))
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
