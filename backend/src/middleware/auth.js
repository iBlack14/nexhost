const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Token requerido' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN')
    return res.status(403).json({ error: 'Solo administradores' })
  next()
}

const requireWhmAccess = (req, res, next) => {
  if (!['ADMIN', 'RESELLER'].includes(req.user?.role))
    return res.status(403).json({ error: 'Acceso WHM restringido a admin/reseller' })
  next()
}

const requireOwnership = (field = 'userId') => (req, res, next) => {
  if (req.user.role === 'ADMIN') return next()
  if (req.params[field] && req.params[field] !== req.user.id)
    return res.status(403).json({ error: 'Acceso denegado' })
  next()
}

module.exports = { authenticate, requireAdmin, requireWhmAccess, requireOwnership }
