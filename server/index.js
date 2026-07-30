require('dotenv').config()
const express = require('express')
const cors = require('cors')
const pool = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))
app.use('/auth', require('./routes/auth'))
app.use('/movies', require('./routes/movies'))
app.use('/admin', require('./routes/admin'))
app.use('/proxy', require('./routes/proxy'))

const PORT = process.env.PORT || 3002
app.listen(PORT, () => console.log(`vi-api on :${PORT}`))

pool.query('SELECT 1').then(() => console.log('DB ok')).catch(e => console.error('DB error', e))
