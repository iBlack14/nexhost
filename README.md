# NexHost — Panel de Hosting

Stack completo para vender hosting con panel admin (WHM) y panel de cliente.

## Estructura

```
nexhost/
├── frontend/          # Next.js 14 (panel UI)
│   ├── app/
│   │   ├── admin/     # Panel administrador
│   │   ├── client/    # Panel cliente
│   │   └── auth/      # Login / registro
│   ├── components/
│   │   ├── admin/     # Componentes del admin
│   │   ├── client/    # Componentes del cliente
│   │   └── shared/    # Componentes compartidos
│   ├── lib/           # Utilidades, config
│   ├── hooks/         # React hooks
│   └── types/         # TypeScript types
└── backend/           # Node.js + Express (API)
    ├── src/
    │   ├── routes/        # Rutas de la API
    │   ├── controllers/   # Lógica de negocio
    │   ├── middleware/     # Auth, validación
    │   └── services/      # Servicios externos
    └── prisma/            # Schema y migraciones
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, Tailwind CSS, NextAuth.js |
| Backend | Node.js, Express, Prisma ORM |
| DB principal | PostgreSQL (usuarios, planes, dominios) |
| DB clientes | MySQL (bases de datos de cada cliente) |
| Auth | NextAuth — Google + Email magic link |
| Servidor web | Nginx (proxy inverso) |
| Process manager | PM2 |

## Inicio rápido

### Backend
```bash
cd backend
cp .env.example .env        # Editar variables
npm install
npx prisma migrate dev
npm run dev                  # Puerto 4000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local  # Editar variables
npm install
npm run dev                  # Puerto 3000
```

## 🚀 Despliegue en VPS (One-Line Installer)

Si usas Ubuntu (Contabo, DigitalOcean, etc.), puedes instalar todo el stack automáticamente con este comando:

```bash
curl -sSL https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/install.sh | bash
```

El instalador te preguntará por:
1.  **Puerto del Backend** (API).
2.  **Puerto del Frontend** (Panel).
3.  **Nombre del repositorio** (para clonar la última versión).

El script configurará Node.js, PostgreSQL, MySQL y PM2 de forma automática.

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `admin` | /admin/* — gestión total del servidor |
| `client` | /client/* — sus propios servicios |
