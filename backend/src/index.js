require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')

const authRoutes    = require('./routes/auth')
const usersRoutes   = require('./routes/users')
const domainsRoutes = require('./routes/domains')
const appsRoutes    = require('./routes/apps')
const dbRoutes      = require('./routes/databases')
const emailRoutes   = require('./routes/emails')
const ticketsRoutes = require('./routes/tickets')
const plansRoutes   = require('./routes/plans')
const adminRoutes   = require('./routes/admin')

const app  = express()
const PORT = process.env.PORT || 4000

// ─── Middleware global ───────────────────────────────────────
app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use('/api/', limiter)

// ─── Rutas ──────────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/users',     usersRoutes)
app.use('/api/domains',   domainsRoutes)
app.use('/api/apps',      appsRoutes)
app.use('/api/databases', dbRoutes)
app.use('/api/emails',    emailRoutes)
app.use('/api/tickets',   ticketsRoutes)
app.use('/api/plans',     plansRoutes)
app.use('/api/admin',     adminRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }))

// ─── Error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
})

app.listen(PORT, () => {
  console.log(`🚀 NexHost API corriendo en http://localhost:${PORT}`)
})
