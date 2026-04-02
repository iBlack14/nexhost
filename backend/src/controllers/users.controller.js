// src/controllers/users.controller.js
const { query } = require('../db')
const { logActivity } = require('../utils/logger')

// GET /api/users - Admin: listar todos los usuarios
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query
    const offset = (page - 1) * limit

    let conditions = []
    let params = []
    let i = 1

    if (search) {
      conditions.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i})`)
      params.push(`%${search}%`)
      i++
    }
    if (status) {
      conditions.push(`u.status = $${i}`)
      params.push(status)
      i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows } = await query(`
      SELECT
        u.id, u.name, u.email, u.role, u.status,
        u.disk_used_mb, u.plan_expires_at, u.created_at,
        p.name as plan_name, p.slug as plan_slug,
        COUNT(DISTINCT d.id) as domain_count,
        COUNT(DISTINCT na.id) as node_app_count
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      LEFT JOIN domains d ON d.user_id = u.id
      LEFT JOIN node_apps na ON na.user_id = u.id
      ${where}
      GROUP BY u.id, p.name, p.slug
      ORDER BY u.created_at DESC
      LIMIT $${i} OFFSET $${i+1}
    `, [...params, limit, offset])

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${where}`,
      params
    )

    res.json({
      users: rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

// GET /api/users/:id
const getOne = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        u.*,
        p.name as plan_name, p.slug as plan_slug,
        p.disk_gb, p.domains_limit, p.databases_limit,
        p.emails_limit, p.node_apps_limit
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = $1
    `, [req.params.id])

    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

// PATCH /api/users/:id/status - suspend/activate
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['active', 'suspended', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }

    const { rows } = await query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, status',
      [status, req.params.id]
    )

    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' })

    await logActivity(req.user.id, `user.${status}`, 'user', req.params.id)
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
}

// GET /api/users/me - perfil del usuario autenticado
const getMe = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        u.id, u.name, u.email, u.image, u.role, u.status,
        u.disk_used_mb, u.plan_expires_at, u.created_at,
        p.name as plan_name, p.slug as plan_slug,
        p.disk_gb, p.ram_mb, p.domains_limit,
        p.databases_limit, p.emails_limit, p.node_apps_limit,
        p.features
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = $1
    `, [req.user.id])

    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' })
  }
}

module.exports = { getAll, getOne, updateStatus, getMe }
