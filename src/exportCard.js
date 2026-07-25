import { formatRuntime } from './utils'

const CARD_W = 640
const CARD_H = 920

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(' ')
  let line = ''
  const lines = []
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  const clipped = maxLines ? lines.slice(0, maxLines) : lines
  clipped.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight))
  return clipped.length
}

export async function exportMovieCard(movie) {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  const posterH = Math.round(CARD_H * 0.6)
  const isWatched = movie.status === 'vista'

  ctx.fillStyle = '#07080a'
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  let posterDrawn = false
  if (movie.poster) {
    try {
      const img = await loadImage(movie.poster)
      const scale = Math.max(CARD_W / img.width, posterH / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (CARD_W - w) / 2, (posterH - h) / 2, w, h)
      posterDrawn = true
    } catch {
      posterDrawn = false
    }
  }

  if (!posterDrawn) {
    ctx.fillStyle = movie.coverColor || '#1a2a4a'
    ctx.fillRect(0, 0, CARD_W, posterH)
    const initials = (movie.title || '?')
      .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    ctx.fillStyle = 'rgba(62, 224, 140, 0.35)'
    ctx.font = '800 140px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, CARD_W / 2, posterH / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  const grad = ctx.createLinearGradient(0, posterH - 160, 0, posterH)
  grad.addColorStop(0, 'rgba(7,8,10,0)')
  grad.addColorStop(1, 'rgba(7,8,10,0.95)')
  ctx.fillStyle = grad
  ctx.fillRect(0, posterH - 160, CARD_W, 160)

  // status badge, top-right
  ctx.font = '700 20px monospace'
  const badgeText = isWatched ? 'VISTA' : 'PENDIENTE'
  const badgeColor = isWatched ? '#3ee08c' : '#4fd6e8'
  const badgeBg = isWatched ? 'rgba(62,224,140,0.18)' : 'rgba(79,214,232,0.18)'
  const tw = ctx.measureText(badgeText).width
  const bx = CARD_W - tw - 72
  const by = 28
  ctx.fillStyle = badgeBg
  roundRect(ctx, bx, by, tw + 32, 40, 20)
  ctx.fill()
  ctx.fillStyle = badgeColor
  ctx.textBaseline = 'middle'
  ctx.fillText(badgeText, bx + 16, by + 21)
  ctx.textBaseline = 'alphabetic'

  let y = posterH + 56
  ctx.fillStyle = '#eef1f0'
  ctx.font = '700 42px sans-serif'
  const titleLines = wrapText(ctx, movie.title || '', 40, y, CARD_W - 80, 50, 2)
  y += titleLines * 50 + 8

  const metaParts = [movie.year, movie.director, movie.runtime ? formatRuntime(movie.runtime) : null].filter(Boolean)
  if (metaParts.length) {
    ctx.fillStyle = '#9aa5a1'
    ctx.font = '400 24px sans-serif'
    ctx.fillText(metaParts.join('   ·   '), 40, y)
    y += 42
  }

  if (movie.genres?.length) {
    let gx = 40
    ctx.font = '600 18px sans-serif'
    movie.genres.slice(0, 4).forEach((g) => {
      const w = ctx.measureText(g).width + 28
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      roundRect(ctx, gx, y - 24, w, 32, 16)
      ctx.fill()
      ctx.fillStyle = '#9aa5a1'
      ctx.fillText(g, gx + 14, y - 3)
      gx += w + 8
    })
    y += 46
  }

  if (isWatched && movie.rating > 0) {
    ctx.font = '32px sans-serif'
    const filled = '★'.repeat(movie.rating)
    const empty = '★'.repeat(5 - movie.rating)
    ctx.fillStyle = '#3ee08c'
    ctx.fillText(filled, 40, y + 8)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillText(empty, 40 + ctx.measureText(filled).width, y + 8)
    y += 48
  }

  if (isWatched && movie.watchedDate) {
    const d = new Date(`${movie.watchedDate}T12:00:00`)
    ctx.fillStyle = '#767f7a'
    ctx.font = '400 20px sans-serif'
    ctx.fillText(`Vista el ${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`, 40, y)
    y += 40
  }

  if (movie.notes) {
    ctx.fillStyle = '#9aa5a1'
    ctx.font = 'italic 22px sans-serif'
    wrapText(ctx, `"${movie.notes}"`, 40, y + 8, CARD_W - 80, 30, 4)
  }

  ctx.fillStyle = 'rgba(62,224,140,0.55)'
  ctx.font = '700 22px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('VI', CARD_W - 40, CARD_H - 32)
  ctx.textAlign = 'left'

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(movie.title || 'pelicula').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}
