'use strict'
const { validationResult } = require('express-validator')
const problem = require('../utils/problem')

function assertValid(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return problem(res, 400, 'ValidationError', 'Invalid request', { errors: errors.array() })
  }
  next()
}

module.exports = { assertValid }