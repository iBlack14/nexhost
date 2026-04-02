// src/utils/logger.js
const { query } = require('../db')

const logActivity = async (userId, action, resourceType = null, resourceId = null, meta = {}) => {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, meta)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, resourceId, JSON.stringify(meta)]
    )
  } catch (err) {
    // Log silently — no interrumpir el flujo principal
    console.error('Logger error:', err.message)
  }
}

module.exports = { logActivity }
