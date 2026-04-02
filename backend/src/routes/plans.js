const router  = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireAdmin } = require('../middleware/auth')
const prisma  = new PrismaClient()

router.get('/', async (req, res) => {
  const plans = await prisma.plan.findMany({ where: { isActive: true } })
  res.json(plans)
})

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const plan = await prisma.plan.create({ data: req.body })
    res.status(201).json(plan)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
