export function initials(title = '') {
  return title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function formatRuntime(min) {
  if (!min) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m}min`
  if (!m) return `${h}h`
  return `${h}h ${m}min`
}
