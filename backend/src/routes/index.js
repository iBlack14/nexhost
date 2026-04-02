// src/routes/index.js
const router = require('express').Router()
const { auth, adminOnly } = require('../middleware/auth')

const usersCtrl    = require('../controllers/users.controller')
const domainsCtrl  = require('../controllers/domains.controller')
const nodeAppsCtrl = require('../controllers/nodeApps.controller')
const ticketsCtrl  = require('../controllers/tickets.controller')
const adminCtrl    = require('../controllers/admin.controller')

// ── Health ────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }))

// ── Me ───────────────────────────────────────────────────
router.get('/me', auth, usersCtrl.getMe)

// ── Dominios ─────────────────────────────────────────────
router.get   ('/domains',     auth, domainsCtrl.getMyDomains)
router.post  ('/domains',     auth, domainsCtrl.createDomain)
router.delete('/domains/:id', auth, domainsCtrl.deleteDomain)

// ── Node Apps ────────────────────────────────────────────
router.get   ('/node-apps',          auth, nodeAppsCtrl.getMyApps)
router.post  ('/node-apps',          auth, nodeAppsCtrl.createApp)
router.post  ('/node-apps/:id/restart', auth, nodeAppsCtrl.restartApp)
router.post  ('/node-apps/:id/stop',    auth, nodeAppsCtrl.stopApp)
router.delete('/node-apps/:id',         auth, nodeAppsCtrl.deleteApp)

// ── Tickets ──────────────────────────────────────────────
router.get ('/tickets',          auth, ticketsCtrl.getMyTickets)
router.post('/tickets',          auth, ticketsCtrl.createTicket)
router.get ('/tickets/:id',      auth, ticketsCtrl.getTicket)
router.post('/tickets/:id/reply',auth, ticketsCtrl.replyTicket)

// ── Admin ────────────────────────────────────────────────
router.get('/admin/stats',        auth, adminOnly, adminCtrl.getStats)
router.get('/admin/server-stats', auth, adminOnly, adminCtrl.getServerStats)
router.get('/admin/users',        auth, adminOnly, usersCtrl.getAll)
router.get('/admin/users/:id',    auth, adminOnly, usersCtrl.getOne)
router.patch('/admin/users/:id/status', auth, adminOnly, usersCtrl.updateStatus)
router.get('/admin/domains',      auth, adminOnly, domainsCtrl.getAllDomains)
router.get('/admin/tickets',      auth, adminOnly, ticketsCtrl.getAllTickets)

module.exports = router
