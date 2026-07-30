const express = require('express')
const { auth } = require('./middleware')

const router = express.Router()

// TMDB no manda Access-Control-Allow-Origin en sus imágenes, así que el
// browser no puede dibujarlas en un <canvas> y exportarlas (PDF/PNG).
// Este proxy las trae desde el servidor (sin restricción CORS) y las
// sirve same-origin para el frontend.
const ALLOWED_HOST = 'image.tmdb.org'

router.get('/image', auth, async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Falta url' })

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return res.status(400).json({ error: 'URL inválida' })
  }
  if (parsed.hostname !== ALLOWED_HOST) {
    return res.status(400).json({ error: 'Host no permitido' })
  }

  try {
    const upstream = await fetch(parsed.toString())
    if (!upstream.ok) return res.status(upstream.status).end()
    res.set('Content-Type', upstream.headers.get('content-type') || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(await upstream.arrayBuffer()))
  } catch (err) {
    console.error('[GET /proxy/image]', err)
    res.status(502).json({ error: 'Error al obtener la imagen' })
  }
})

module.exports = router
