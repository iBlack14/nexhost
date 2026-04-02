// src/controllers/domains.controller.js
const { query } = require('../db')
const { logActivity } = require('../utils/logger')

// GET /api/domains - dominios del usuario autenticado
const getMyDomains = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT d.*, 
        COUNT(DISTINCT na.id) as node_app_count,
        COUNT(DISTINCT ea.id) as email_count
      FROM domains d
      LEFT JOIN node_apps na ON na.domain_id = d.id
      LEFT JOIN email_accounts ea ON ea.domain_id = d.id
      WHERE d.user_id = $1
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `, [req.user.id])

    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dominios' })
  }
}

// POST /api/domains - crear dominio
const createDomain = async (req, res) => {
  try {
    const { domain, type = 'wordpress', php_version = '8.3' } = req.body

    if (!domain) return res.status(400).json({ error: 'Dominio requerido' })

    // Verificar límite del plan
    const planCheck = await query(`
      SELECT COUNT(d.id) as count, p.domains_limit
      FROM users u
      JOIN plans p ON u.plan_id = p.id
      LEFT JOIN domains d ON d.user_id = u.id
      WHERE u.id = $1
      GROUP BY p.domains_limit
    `, [req.user.id])

    if (planCheck.rows.length && parseInt(planCheck.rows[0].count) >= parseInt(planCheck.rows[0].domains_limit)) {
      return res.status(403).json({ error: 'Límite de dominios alcanzado en tu plan' })
    }

    // Verificar que el dominio no exista
    const existing = await query('SELECT id FROM domains WHERE domain = $1', [domain])
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Este dominio ya está registrado' })
    }

    const doc_root = `/home/${req.user.linux_user}/public_html/${domain}`

    const { rows } = await query(`
      INSERT INTO domains (user_id, domain, type, php_version, document_root)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, domain, type, php_version, doc_root])

    await logActivity(req.user.id, 'domain.created', 'domain', rows[0].id, { domain, type })
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear dominio' })
  }
}

// DELETE /api/domains/:id
const deleteDomain = async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM domains WHERE id = $1 AND user_id = $2 RETURNING id, domain',
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Dominio no encontrado' })

    await logActivity(req.user.id, 'domain.deleted', 'domain', req.params.id)
    res.json({ message: 'Dominio eliminado', domain: rows[0].domain })
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar dominio' })
  }
}

// Admin: GET /api/admin/domains
const getAllDomains = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT d.*, u.name as user_name, u.email as user_email
      FROM domains d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 100
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener dominios' })
  }
}

module.exports = { getMyDomains, createDomain, deleteDomain, getAllDomains }
