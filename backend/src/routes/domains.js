const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/domains — dominios del cliente autenticado
router.get('/', authenticate, async (req, res) => {
  const account = await prisma.account.findUnique({ where: { userId: req.user.id } })
  if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' })
  const domains = await prisma.domain.findMany({ where: { accountId: account.id } })
  res.json(domains)
})

// POST /api/domains — crear dominio
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, type, phpVersion } = req.body
    const account = await prisma.account.findUnique({
      where: { userId: req.user.id },
      include: { plan: true, domains: true },
    })
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' })
    if (account.domains.length >= account.plan.maxDomains)
      return res.status(403).json({ error: 'Límite de dominios alcanzado en tu plan' })

    const domain = await prisma.domain.create({
      data: { accountId: account.id, name, type: type || 'STATIC', phpVersion },
    })
    res.status(201).json(domain)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/domains/:id
router.delete('/:id', authenticate, async (req, res) => {
  const domain = await prisma.domain.findUnique({ where: { id: req.params.id } })
  if (!domain) return res.status(404).json({ error: 'Dominio no encontrado' })
  await prisma.domain.delete({ where: { id: req.params.id } })
  res.json({ message: 'Dominio eliminado' })
})

module.exports = router
