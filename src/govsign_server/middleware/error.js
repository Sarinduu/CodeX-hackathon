'use strict'
const problem = require('../utils/problem')

function notFoundHandler(req, res) {
  return problem(res, 404, 'NotFound', 'Route not found')
}

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err)
  return problem(res, 500, 'InternalServerError', 'Something went wrong')
}

module.exports = { notFoundHandler, errorHandler }