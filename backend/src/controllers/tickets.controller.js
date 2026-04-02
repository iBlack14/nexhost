// src/controllers/tickets.controller.js
const { query } = require('../db')

const getMyTickets = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT t.*, COUNT(tm.id) as message_count
      FROM tickets t
      LEFT JOIN ticket_messages tm ON tm.ticket_id = t.id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.updated_at DESC
    `, [req.user.id])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tickets' })
  }
}

const getTicket = async (req, res) => {
  try {
    const ticket = await query(
      'SELECT * FROM tickets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!ticket.rows.length) return res.status(404).json({ error: 'Ticket no encontrado' })

    const messages = await query(`
      SELECT tm.*, u.name, u.image, u.role
      FROM ticket_messages tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.ticket_id = $1
      ORDER BY tm.created_at ASC
    `, [req.params.id])

    res.json({ ...ticket.rows[0], messages: messages.rows })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ticket' })
  }
}

const createTicket = async (req, res) => {
  try {
    const { subject, message, priority = 'medium' } = req.body
    if (!subject || !message) return res.status(400).json({ error: 'Asunto y mensaje requeridos' })

    const { rows } = await query(
      'INSERT INTO tickets (user_id, subject, priority) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, subject, priority]
    )

    await query(
      'INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES ($1, $2, $3)',
      [rows[0].id, req.user.id, message]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al crear ticket' })
  }
}

const replyTicket = async (req, res) => {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ error: 'Mensaje requerido' })

    const ticket = await query(
      'SELECT * FROM tickets WHERE id = $1',
      [req.params.id]
    )
    if (!ticket.rows.length) return res.status(404).json({ error: 'Ticket no encontrado' })

    // Verificar acceso: dueño o admin
    if (ticket.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin acceso' })
    }

    const isStaff = req.user.role === 'admin'

    const { rows } = await query(
      'INSERT INTO ticket_messages (ticket_id, user_id, message, is_staff) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.user.id, message, isStaff]
    )

    await query(
      'UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2',
      [isStaff ? 'in_progress' : 'open', req.params.id]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al responder ticket' })
  }
}

// Admin: todos los tickets
const getAllTickets = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT t.*, u.name as user_name, u.email as user_email,
        COUNT(tm.id) as message_count
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN ticket_messages tm ON tm.ticket_id = t.id
      GROUP BY t.id, u.name, u.email
      ORDER BY t.updated_at DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tickets' })
  }
}

module.exports = { getMyTickets, getTicket, createTicket, replyTicket, getAllTickets }
