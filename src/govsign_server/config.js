'use strict'
require('dotenv').config()

module.exports = {
  ENV: process.env.NODE_ENV || 'development',
  SERVICE_NAME: process.env.SERVICE_NAME || 'GOVSIGN_SERVER',
  PORT: process.env.PORT || 5000,

  SLUDI_BASE_URL: process.env.SLUDI_BASE_URL || 'https://sludi.example.gov.lk',
  SLUDI_INTROSPECT_PATH: process.env.SLUDI_INTROSPECT_PATH || '/oauth2/introspect',
  SLUDI_JWKS_URL: process.env.SLUDI_JWKS_URL || '',
  SLUDI_CLIENT_ID: process.env.SLUDI_CLIENT_ID || 'change-me',
  SLUDI_CLIENT_SECRET: process.env.SLUDI_CLIENT_SECRET || 'change-me',

  NDX_BASE_URL: process.env.NDX_BASE_URL || 'https://ndx.example.gov.lk',
  NDX_API_KEY: process.env.NDX_API_KEY || 'change-me',

  PAYDPI_BASE_URL: process.env.PAYDPI_BASE_URL || 'https://paydpi.example.gov.lk',
  PAYDPI_API_KEY: process.env.PAYDPI_API_KEY || 'change-me',

  WEBHOOK_SECRET_NDX: process.env.WEBHOOK_SECRET_NDX || 'dev-ndx-secret',
  WEBHOOK_SECRET_PAYDPI: process.env.WEBHOOK_SECRET_PAYDPI || 'dev-paydpi-secret',
}