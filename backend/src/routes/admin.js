const router = require('express').Router()
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireAdmin, requireWhmAccess } = require('../middleware/auth')
const cloudflare = require('../services/cloudflare.service')
const { collectServiceStatus } = require('../services/serviceStatus.service')

const prisma = new PrismaClient()

router.use(authenticate)

// ── Admin dashboard (legacy) ───────────────────────────────────────────
router.get('/stats', requireAdmin, async (req, res) => {
  const [users, domains, nodeApps, tickets] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.domain.count(),
    prisma.nodeApp.count({ where: { status: 'RUNNING' } }),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
  ])
  res.json({ users, domains, nodeApps, openTickets: tickets })
})

router.get('/users', requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { in: ['CLIENT', 'RESELLER'] } },
    include: {
      account: {
        include: {
          plan: true,
          domains: { select: { id: true } },
          nodeApps: { select: { id: true } },
        },
      },
      resellerProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
})

router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: req.body.role || undefined },
  })
  res.json(user)
})

router.patch('/accounts/:id/status', requireAdmin, async (req, res) => {
  const account = await prisma.account.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  })
  res.json(account)
})

// ── WHM: Enumerar cuentas ──────────────────────────────────────────────
router.get('/whm/accounts', requireWhmAccess, async (req, res) => {
  const { status, resellerId } = req.query
  const where = {}

  if (status) where.status = status

  if (req.user.role === 'RESELLER') {
    where.resellerUserId = req.user.id
  } else if (resellerId) {
    where.resellerUserId = resellerId
  }

  const accounts = await prisma.hostingAccount.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      reseller: { select: { id: true, name: true, email: true } },
      jobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      dnsZones: { include: { records: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(accounts)
})

// ── WHM: Crear cuenta + encolar job ────────────────────────────────────
router.post('/whm/accounts', requireWhmAccess, async (req, res) => {
  try {
    const {
      username,
      primaryDomain,
      ownerEmail,
      ownerName,
      ownerPassword,
      ownerUserId,
      planName,
      enableSSL = true,
      ipAddress,
    } = req.body

    if (!username || !primaryDomain) {
      return res.status(400).json({ error: 'username y primaryDomain son requeridos' })
    }

    if (!ownerUserId && (!ownerEmail || !ownerName)) {
      return res.status(400).json({ error: 'ownerUserId o ownerEmail/ownerName son requeridos' })
    }

    let owner
    if (ownerUserId) {
      owner = await prisma.user.findUnique({ where: { id: ownerUserId } })
      if (!owner) return res.status(404).json({ error: 'Usuario owner no encontrado' })
    } else {
      owner = await prisma.user.findUnique({ where: { email: ownerEmail } })
      if (!owner) {
        const password = ownerPassword || crypto.randomBytes(10).toString('hex')
        owner = await prisma.user.create({
          data: {
            name: ownerName,
            email: ownerEmail,
            password: await bcrypt.hash(password, 12),
            role: 'CLIENT',
          },
        })
      }
    }

    let resellerUserId = req.user.role === 'RESELLER' ? req.user.id : (req.body.resellerUserId || null)
    if (resellerUserId) {
      const reseller = await prisma.user.findUnique({
        where: { id: resellerUserId },
        include: { resellerProfile: true },
      })
      if (!reseller || reseller.role !== 'RESELLER') {
        return res.status(400).json({ error: 'resellerUserId inválido' })
      }
      const accountsCount = await prisma.hostingAccount.count({ where: { resellerUserId } })
      if (accountsCount >= reseller.resellerProfile.maxAccounts) {
        return res.status(403).json({ error: 'Límite de cuentas del reseller alcanzado' })
      }
    }

    const account = await prisma.hostingAccount.create({
      data: {
        username,
        primaryDomain,
        ownerUserId: owner.id,
        resellerUserId,
        planName: planName || 'default',
        status: 'PROVISIONING',
        ipAddress: ipAddress || process.env.SERVER_PUBLIC_IP || null,
      },
    })

    const job = await prisma.provisionJob.create({
      data: {
        hostingAccountId: account.id,
        requestedById: req.user.id,
        type: 'CREATE_HOSTING_ACCOUNT',
        status: 'PENDING',
        payload: { enableSSL: Boolean(enableSSL) },
      },
    })

    res.status(201).json({ account, jobId: job.id, status: job.status })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/whm/jobs/:id', requireWhmAccess, async (req, res) => {
  const job = await prisma.provisionJob.findUnique({
    where: { id: req.params.id },
    include: {
      hostingAccount: true,
      steps: { orderBy: { createdAt: 'asc' } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  })
  if (!job) return res.status(404).json({ error: 'Job no encontrado' })

  if (req.user.role === 'RESELLER' && job.hostingAccount?.resellerUserId !== req.user.id) {
    return res.status(403).json({ error: 'No tienes acceso a este job' })
  }

  res.json(job)
})

// ── WHM DNS ─────────────────────────────────────────────────────────────
router.get('/whm/dns/zones', requireWhmAccess, async (req, res) => {
  const where = {}
  if (req.user.role === 'RESELLER') {
    where.hostingAccount = { resellerUserId: req.user.id }
  }

  const zones = await prisma.dnsZone.findMany({
    where,
    include: {
      records: true,
      hostingAccount: { select: { id: true, primaryDomain: true, resellerUserId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  let cloudflareZones = []
  if (cloudflare.isConfigured()) {
    try {
      cloudflareZones = await cloudflare.listZones()
    } catch {
      cloudflareZones = []
    }
  }

  res.json({ zones, cloudflareZones, cloudflareConfigured: cloudflare.isConfigured() })
})

router.post('/whm/dns/zones/:id/records', requireWhmAccess, async (req, res) => {
  const { type, name, content, ttl = 300, proxied = false } = req.body
  if (!type || !name || !content) {
    return res.status(400).json({ error: 'type, name y content son requeridos' })
  }

  const zone = await prisma.dnsZone.findUnique({
    where: { id: req.params.id },
    include: { hostingAccount: true },
  })
  if (!zone) return res.status(404).json({ error: 'Zona no encontrada' })

  if (req.user.role === 'RESELLER' && zone.hostingAccount?.resellerUserId !== req.user.id) {
    return res.status(403).json({ error: 'No tienes acceso a esta zona' })
  }

  let cloudflareRecordId = null
  let status = 'LOCAL_ONLY'
  if (cloudflare.isConfigured() && zone.cloudflareZoneId) {
    const record = await cloudflare.createRecord(zone.cloudflareZoneId, { type, name, content, ttl, proxied })
    cloudflareRecordId = record.id
    status = 'SYNCED'
  }

  const record = await prisma.dnsRecord.create({
    data: {
      zoneId: zone.id,
      type,
      name,
      content,
      ttl: Number(ttl),
      proxied: Boolean(proxied),
      cloudflareRecordId,
      status,
    },
  })
  res.status(201).json(record)
})

// ── WHM Estado de servicios ─────────────────────────────────────────────
router.get('/whm/services/status', requireWhmAccess, async (req, res) => {
  const lastSnapshot = await prisma.serviceStatusSnapshot.findFirst({
    orderBy: { capturedAt: 'desc' },
  })

  const now = Date.now()
  if (lastSnapshot && now - new Date(lastSnapshot.capturedAt).getTime() < 30_000) {
    return res.json(lastSnapshot)
  }

  const live = await collectServiceStatus()
  const snapshot = await prisma.serviceStatusSnapshot.create({ data: live })
  res.json(snapshot)
})

router.get('/server-stats', requireAdmin, async (req, res) => {
  const live = await collectServiceStatus()
  res.json({
    cpu: { cores: 4, usage: live.cpuUsage },
    ram: { total_gb: 0, used_gb: 0, usage_pct: live.ramUsage },
    disk: { total_gb: 0, used_gb: 0, usage_pct: live.diskUsage },
    bandwidth: { total_gb: 0, used_gb: 0, usage_pct: 0 },
    connections: 0,
    uptime_days: 0,
    load_avg: [],
  })
})

module.exports = router
