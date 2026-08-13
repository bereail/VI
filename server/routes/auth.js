const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')

const router = express.Router()

function token(userId, email) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña demasiado corta' })
    const norm = email.trim().toLowerCase()
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [norm])
    if (exists.rows.length) return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id',
      [norm, hash]
    )
    res.json({ token: token(result.rows[0].id, norm), email: norm })
  } catch (err) {
    console.error('[register]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const norm = email?.trim().toLowerCase()
    if (!norm || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email=$1', [norm])
    if (!result.rows.length) return res.status(401).json({ error: 'No existe una cuenta con ese email.' })
    const ok = await bcrypt.compare(password, result.rows[0].password_hash)
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta.' })
    res.json({ token: token(result.rows[0].id, norm), email: norm })
  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.post('/guest', async (req, res) => {
  try {
    const email = process.env.SEED_TEST_EMAIL
    if (!email) return res.status(503).json({ error: 'Modo invitado no disponible' })
    const result = await pool.query('SELECT id FROM users WHERE email=$1', [email])
    if (!result.rows.length) return res.status(503).json({ error: 'Modo invitado no disponible' })
    res.json({ token: token(result.rows[0].id, email), email })
  } catch (err) {
    console.error('[guest]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body
    const norm = email?.trim().toLowerCase()
    if (!norm || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })
    const result = await pool.query('SELECT id FROM users WHERE email=$1', [norm])
    if (!result.rows.length) return res.status(404).json({ error: 'No existe una cuenta con ese email.' })
    const hash = await bcrypt.hash(password, 10)
    await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, norm])
    res.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
