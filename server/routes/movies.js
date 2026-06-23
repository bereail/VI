const express = require('express')
const pool = require('../db')
const { auth } = require('./middleware')

const router = express.Router()

function toClient(row) {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    director: row.director,
    genres: row.genres || [],
    runtime: row.runtime,
    poster: row.poster,
    overview: row.overview,
    backdrop: row.backdrop,
    tmdb_id: row.tmdb_id,
    status: row.status,
    rating: row.rating,
    watchedDate: row.watched_date ? String(row.watched_date).slice(0, 10) : null,
    notes: row.notes,
    priority: row.priority,
    addedDate: row.added_date,
    createdAt: row.created_at,
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM movies WHERE user_id=$1 ORDER BY created_at DESC',
      [req.userId]
    )
    res.json(result.rows.map(toClient))
  } catch (err) {
    console.error('[GET /movies]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const {
      title, year, director, genres, runtime, poster, overview, backdrop,
      tmdb_id, status, rating, watchedDate, notes, priority, addedDate,
    } = req.body
    if (!title) return res.status(400).json({ error: 'El título es requerido' })
    const result = await pool.query(
      `INSERT INTO movies
        (user_id,title,year,director,genres,runtime,poster,overview,backdrop,
         tmdb_id,status,rating,watched_date,notes,priority,added_date)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        req.userId, title,
        year ? parseInt(year) : null,
        director || null,
        JSON.stringify(genres || []),
        runtime ? parseInt(runtime) : null,
        poster || null,
        overview || null,
        backdrop || null,
        tmdb_id ? parseInt(tmdb_id) : null,
        status || 'pendiente',
        rating ? Math.min(5, Math.max(0, parseInt(rating))) : 0,
        watchedDate || null,
        notes || null,
        priority === true || priority === 'true',
        addedDate || null,
      ]
    )
    res.status(201).json(toClient(result.rows[0]))
  } catch (err) {
    console.error('[POST /movies]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const own = await pool.query('SELECT id FROM movies WHERE id=$1 AND user_id=$2', [id, req.userId])
    if (!own.rows.length) return res.status(404).json({ error: 'No encontrada' })
    const {
      title, year, director, genres, runtime, poster, overview, backdrop,
      tmdb_id, status, rating, watchedDate, notes, priority, addedDate,
    } = req.body
    const result = await pool.query(
      `UPDATE movies SET
        title=COALESCE($1,title), year=$2, director=$3, genres=$4,
        runtime=$5, poster=$6, overview=$7, backdrop=$8, tmdb_id=$9,
        status=COALESCE($10,status), rating=COALESCE($11,rating),
        watched_date=$12, notes=$13, priority=COALESCE($14,priority),
        added_date=COALESCE($15,added_date)
       WHERE id=$16 AND user_id=$17 RETURNING *`,
      [
        title || null,
        year ? parseInt(year) : null,
        director || null,
        genres ? JSON.stringify(genres) : null,
        runtime ? parseInt(runtime) : null,
        poster || null,
        overview || null,
        backdrop || null,
        tmdb_id ? parseInt(tmdb_id) : null,
        status || null,
        rating != null ? Math.min(5, Math.max(0, parseInt(rating))) : null,
        watchedDate || null,
        notes != null ? notes : null,
        priority != null ? (priority === true || priority === 'true') : null,
        addedDate || null,
        id, req.userId,
      ]
    )
    res.json(toClient(result.rows[0]))
  } catch (err) {
    console.error('[PUT /movies/:id]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM movies WHERE id=$1 AND user_id=$2 RETURNING id',
      [id, req.userId]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrada' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /movies/:id]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
