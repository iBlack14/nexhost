// src/controllers/admin.controller.js
const { query } = require('../db')

const getStats = async (req, res) => {
  try {
    const [users, domains, nodeApps, revenue, tickets, recentActivity] = await Promise.all([
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
        FROM users WHERE role = 'client'`),

      query(`SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active
        FROM domains`),

      query(`SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'running') as running
        FROM node_apps`),

      query(`SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND created_at > date_trunc('month', NOW())), 0) as this_month,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND created_at > date_trunc('month', NOW()) - INTERVAL '1 month'
          AND created_at < date_trunc('month', NOW())), 0) as last_month
        FROM invoices`),

      query(`SELECT COUNT(*) as open FROM tickets WHERE status IN ('open','in_progress')`),

      query(`SELECT al.*, u.name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10`)
    ])

    res.json({
      users: users.rows[0],
      domains: domains.rows[0],
      nodeApps: nodeApps.rows[0],
      revenue: revenue.rows[0],
      tickets: tickets.rows[0],
      recentActivity: recentActivity.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

const getServerStats = async (req, res) => {
  // En producción esto vendría del VPS via SSH
  // Por ahora retorna datos mock estructurados
  res.json({
    cpu: { cores: 4, usage: 34 },
    ram: { total_gb: 8, used_gb: 5.2, usage_pct: 65 },
    disk: { total_gb: 200, used_gb: 120, usage_pct: 60 },
    bandwidth: { total_gb: 1000, used_gb: 220, usage_pct: 22 },
    connections: 142,
    uptime_days: 47,
    load_avg: [0.82, 0.74, 0.69],
  })
}

module.exports = { getStats, getServerStats }
