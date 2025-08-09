'use strict'
const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')

const r = Router()

r.get('/verify', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, scopes: req.user.scopes }, active: true })
})

module.exports = r