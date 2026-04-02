const router = require('express').Router()
const { authenticate, requireAdmin } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Todos los endpoints de admin requieren autenticación y rol ADMIN
router.use(authenticate, requireAdmin)

// GET /api/admin/stats — métricas del dashboard
router.get('/stats', async (req, res) => {
  const [users, domains, nodeApps, tickets] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.domain.count(),
    prisma.nodeApp.count({ where: { status: 'RUNNING' } }),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
  ])
  res.json({ users, domains, nodeApps, openTickets: tickets })
})

// GET /api/admin/users — lista todos los usuarios con su cuenta
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    include: {
      account: {
        include: {
          plan: true,
          domains: { select: { id: true } },
          nodeApps: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
})

// PATCH /api/admin/accounts/:id/status — suspender / activar cuenta
router.patch('/accounts/:id/status', async (req, res) => {
  const account = await prisma.account.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  })
  res.json(account)
})

module.exports = router
