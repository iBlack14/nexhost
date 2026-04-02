// src/controllers/nodeApps.controller.js
const { query } = require('../db')
const { logActivity } = require('../utils/logger')
const sshService = require('../services/ssh.service')

const getMyApps = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT na.*, d.domain
      FROM node_apps na
      LEFT JOIN domains d ON na.domain_id = d.id
      WHERE na.user_id = $1
      ORDER BY na.created_at DESC
    `, [req.user.id])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener apps' })
  }
}

const createApp = async (req, res) => {
  try {
    const { name, port, start_command = 'npm start', node_version = '20', domain_id } = req.body

    if (!name || !port) return res.status(400).json({ error: 'Nombre y puerto requeridos' })

    // Verificar límite del plan
    const planCheck = await query(`
      SELECT COUNT(na.id) as count, p.node_apps_limit
      FROM users u
      JOIN plans p ON u.plan_id = p.id
      LEFT JOIN node_apps na ON na.user_id = u.id
      WHERE u.id = $1
      GROUP BY p.node_apps_limit
    `, [req.user.id])

    if (planCheck.rows.length && parseInt(planCheck.rows[0].count) >= parseInt(planCheck.rows[0].node_apps_limit)) {
      return res.status(403).json({ error: 'Límite de apps Node.js alcanzado en tu plan' })
    }

    const { rows } = await query(`
      INSERT INTO node_apps (user_id, domain_id, name, port, start_command, node_version)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.id, domain_id || null, name, port, start_command, node_version])

    await logActivity(req.user.id, 'node_app.created', 'node_app', rows[0].id, { name, port })
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al crear app' })
  }
}

const restartApp = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM node_apps WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'App no encontrada' })

    const app = rows[0]
    // Reiniciar via SSH con PM2
    await sshService.exec(`pm2 restart ${app.name} || pm2 start ${app.start_command} --name ${app.name}`)

    await query('UPDATE node_apps SET status = $1 WHERE id = $2', ['running', app.id])
    await logActivity(req.user.id, 'node_app.restarted', 'node_app', app.id)

    res.json({ message: `App "${app.name}" reiniciada exitosamente` })
  } catch (err) {
    res.status(500).json({ error: 'Error al reiniciar app' })
  }
}

const stopApp = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM node_apps WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'App no encontrada' })

    await sshService.exec(`pm2 stop ${rows[0].name}`)
    await query('UPDATE node_apps SET status = $1 WHERE id = $2', ['stopped', rows[0].id])

    res.json({ message: 'App detenida' })
  } catch (err) {
    res.status(500).json({ error: 'Error al detener app' })
  }
}

const deleteApp = async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM node_apps WHERE id = $1 AND user_id = $2 RETURNING name',
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'App no encontrada' })

    await sshService.exec(`pm2 delete ${rows[0].name} || true`)
    res.json({ message: 'App eliminada' })
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar app' })
  }
}

module.exports = { getMyApps, createApp, restartApp, stopApp, deleteApp }
