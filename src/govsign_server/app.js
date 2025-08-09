'use strict'
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const routes = require('./routes')
const { ENV } = require('./config')
const { notFoundHandler, errorHandler } = require('./middleware/error')

const app = express()
app.set('trust proxy', true)
app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))
app.use(morgan(ENV === 'production' ? 'combined' : 'dev'))

app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }))

app.get('/health', (req, res) => res.json({ ok: true, service: 'govsign-api', env: ENV }))
app.use(routes)
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app