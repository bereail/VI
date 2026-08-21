const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const pool = require('../db')
const { rateLimit } = require('../rateLimit')

const router = express.Router()

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Demasiados intentos. Probá de nuevo en unos minutos.' })

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

function token(userId, email) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', authLimiter, async (req, res) => {
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

router.post('/login', authLimiter, async (req, res) => {
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

// Solicitar recuperación: envía un email con un link de un solo uso. Nunca revela
// si el email existe o no, para no permitir enumeración de cuentas.
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const norm = req.body.email?.trim().toLowerCase()
    if (!norm) return res.status(400).json({ error: 'Email requerido' })

    const result = await pool.query('SELECT id FROM users WHERE email=$1', [norm])
    if (!result.rows.length) return res.json({ ok: true })

    const userId = result.rows[0].id
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, resetToken, expiresAt]
    )

    const resetUrl = `https://ailonline.com.ar/vi/?reset_token=${resetToken}`

    await transporter.sendMail({
      from: `"VI" <${process.env.EMAIL_USER}>`,
      to: norm,
      subject: 'Recuperar contraseña — VI',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0f2b1c;">Recuperar contraseña</h2>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en VI.</p>
          <p>
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 24px;background:#0f2b1c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
              Establecer nueva contraseña
            </a>
          </p>
          <p style="color:#666;font-size:14px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignorá este email.</p>
        </div>
      `,
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    res.status(500).json({ error: 'Error al enviar el email' })
  }
})

// Restablecer con el token recibido por email.
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token: resetToken, password } = req.body
    if (!resetToken || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' })
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña demasiado corta' })

    const result = await pool.query(
      'SELECT id, user_id FROM password_reset_tokens WHERE token=$1 AND used=FALSE AND expires_at > NOW()',
      [resetToken]
    )
    if (!result.rows.length) return res.status(400).json({ error: 'El enlace es inválido o ya expiró.' })

    const { id: tokenId, user_id: userId } = result.rows[0]
    const hash = await bcrypt.hash(password, 10)

    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, userId])
    await pool.query('UPDATE password_reset_tokens SET used=TRUE WHERE id=$1', [tokenId])

    res.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
