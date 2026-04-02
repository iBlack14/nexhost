const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/tickets
router.get('/', authenticate, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id }
  const tickets = await prisma.ticket.findMany({
    where,
    include: { messages: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(tickets)
})

// POST /api/tickets
router.post('/', authenticate, async (req, res) => {
  const { subject, body, priority } = req.body
  const ticket = await prisma.ticket.create({
    data: {
      userId: req.user.id,
      subject,
      priority: priority || 'MEDIUM',
      messages: { create: { fromAdmin: false, body } },
    },
    include: { messages: true },
  })
  res.status(201).json(ticket)
})

// POST /api/tickets/:id/reply
router.post('/:id/reply', authenticate, async (req, res) => {
  const { body } = req.body
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: req.params.id,
      fromAdmin: req.user.role === 'ADMIN',
      body,
    },
  })
  res.status(201).json(message)
})

module.exports = router
