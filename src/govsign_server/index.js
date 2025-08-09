'use strict'
require('dotenv').config()
const { PORT, ENV, SERVICE_NAME } = require('./config')
const app = require('./app')

app.listen(PORT, () => {
  console.log(`➡️  ${SERVICE_NAME} listening on :${PORT} (${ENV})`)
})