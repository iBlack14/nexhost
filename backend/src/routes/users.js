const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
router.get('/', authenticate, (req, res) => res.json([]))
module.exports = router
