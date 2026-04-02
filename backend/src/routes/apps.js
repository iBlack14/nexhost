const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/apps
router.get('/', authenticate, async (req, res) => {
  const account = await prisma.account.findUnique({ where: { userId: req.user.id } })
  if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' })
  const apps = await prisma.nodeApp.findMany({ where: { accountId: account.id } })
  res.json(apps)
})

// POST /api/apps
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, port, domain } = req.body
    const account = await prisma.account.findUnique({
      where: { userId: req.user.id },
      include: { plan: true, nodeApps: true },
    })
    if (account.nodeApps.length >= account.plan.maxNodeApps)
      return res.status(403).json({ error: 'Límite de apps Node.js alcanzado' })

    const app = await prisma.nodeApp.create({
      data: { accountId: account.id, name, port: parseInt(port), domain, status: 'STOPPED' },
    })
    res.status(201).json(app)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/apps/:id/status
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body
  const app = await prisma.nodeApp.update({
    where: { id: req.params.id },
    data: { status },
  })
  res.json(app)
})

module.exports = router
