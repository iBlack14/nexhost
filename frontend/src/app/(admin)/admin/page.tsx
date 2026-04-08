'use client'

import Link from 'next/link'
import { ListChecks, UserPlus, Globe, Activity } from 'lucide-react'

const cards = [
  {
    href: '/admin/accounts',
    title: 'Enumerar las Cuentas',
    description: 'Lista de cuentas creadas en el servidor y su estado de aprovisionamiento.',
    icon: ListChecks,
  },
  {
    href: '/admin/accounts/new',
    title: 'Crear una nueva cuenta',
    description: 'Crea una cuenta tipo cPanel y encola la provisión automática.',
    icon: UserPlus,
  },
  {
    href: '/admin/dns',
    title: 'DNS Zone Manager',
    description: 'Gestiona zonas DNS y registros A/CNAME/TXT vía Cloudflare.',
    icon: Globe,
  },
  {
    href: '/admin/services',
    title: 'Estado del servicio',
    description: 'Monitoreo de Nginx, MySQL, PostgreSQL, PM2 y uso de recursos.',
    icon: Activity,
  },
]

export default function AdminHomePage() {
  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold">Panel Maestro WHM</h1>
        <p className="text-sm text-nx-muted mt-1">Centro de control para cuentas, DNS y servicios.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="nx-card p-5 hover:border-nx-border2 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full border border-nx-border flex items-center justify-center">
                  <Icon size={22} className="text-nx-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{card.title}</h2>
                  <p className="text-sm text-nx-muted mt-1">{card.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
