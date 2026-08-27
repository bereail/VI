const express = require('express')
const pool = require('../db')
const { auth } = require('./middleware')

const router = express.Router()
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

function adminOnly(req, res, next) {
  if (req.userEmail !== ADMIN_EMAIL) return res.status(403).json({ error: 'Acceso denegado' })
  next()
}

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.created_at, COUNT(m.id)::int AS movie_count
      FROM users u LEFT JOIN movies m ON m.user_id = u.id
      GROUP BY u.id ORDER BY u.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error('[admin/users]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.get('/users/:id/movies', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT title, year, director, status, rating, watched_date, added_date
       FROM movies WHERE user_id=$1 ORDER BY added_date DESC`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('[admin/users/:id/movies]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
