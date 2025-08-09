'use strict'
const problem = require('../utils/problem')
const { introspect } = require('../services/sludi')

async function requireAuth(req, res, next) {
  try {
    const hdr = req.get('Authorization') || ''
    const [, token] = hdr.match(/^Bearer\s+(.+)$/i) || []
    if (!token) return problem(res, 401, 'Unauthorized', 'Missing Bearer token')

    const info = await introspect(token)
    if (!info?.active) return problem(res, 401, 'Unauthorized', 'Invalid/expired token')

    req.user = { id: info.sub, scopes: (info.scope || '').split(' ').filter(Boolean), raw: info }
    next()
  } catch (err) {
    console.error('Auth error:', err?.response?.data || err.message)
    return problem(res, 401, 'Unauthorized', 'Token introspection failed')
  }
}

function requireScope(scope) {
  return (req, res, next) => {
    if (!req.user?.scopes?.includes(scope)) {
      return problem(res, 403, 'Forbidden', `Missing required scope: ${scope}`)
    }
    next()
  }
}

module.exports = { requireAuth, requireScope }