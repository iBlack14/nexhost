// src/app/layout.tsx
import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import Providers from '@/components/layout/Providers'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'NexHost — Panel de Hosting',
  description: 'Administra tus dominios, aplicaciones y servicios',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans bg-nx-bg text-white antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#111318',
                color: '#f0f2f5',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#111318' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#111318' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
