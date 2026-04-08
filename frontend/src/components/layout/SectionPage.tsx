import Link from 'next/link'

interface SectionPageProps {
  title: string
  description: string
}

export default function SectionPage({ title, description }: SectionPageProps) {
  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-nx-muted mt-1">{description}</p>
      </div>

      <div className="nx-card p-5">
        <p className="text-sm text-nx-muted">
          Este módulo está activo como base y listo para conectar lógica/API.
        </p>
        <div className="mt-4">
          <Link href="/dashboard" className="btn-ghost">
            Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
