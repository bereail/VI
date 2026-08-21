import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { api } from '../api'

const MIGRATED_KEY = 'vi_migrated_v2'

async function migrateLocalStorage(email) {
  if (localStorage.getItem(MIGRATED_KEY)) return
  const key = `vi_movies_${email}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const movies = JSON.parse(raw)
      if (Array.isArray(movies) && movies.length > 0) {
        await Promise.all(movies.map(m => api.post('/movies', m).catch(() => {})))
      }
    }
  } catch { /* ignore */ }
  localStorage.setItem(MIGRATED_KEY, '1')
}

export function checkBackupReminder() {
  const last = localStorage.getItem('vi_last_backup')
  if (!last) return true
  const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince > 7
}

export function useMovies(userEmail) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const moviesRef = useRef(movies)

  useEffect(() => { moviesRef.current = movies }, [movies])

  useEffect(() => {
    if (!userEmail) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    migrateLocalStorage(userEmail)
      .then(() => api.get('/movies'))
      .then(data => { if (!cancelled) setMovies(data) })
      .catch(err => { if (!cancelled) setLoadError(err.message || 'No se pudo cargar tu biblioteca.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userEmail])

  const addMovie = useCallback(async (data) => {
    const movie = await api.post('/movies', {
      status: 'pendiente',
      rating: 0,
      notes: '',
      addedDate: new Date().toISOString(),
      ...data,
    })
    setMovies(prev => [movie, ...prev])
    return movie
  }, [])

  const updateMovie = useCallback(async (id, changes) => {
    const updated = await api.put(`/movies/${id}`, changes)
    setMovies(prev => prev.map(m => m.id === id ? updated : m))
  }, [])

  const deleteMovie = useCallback(async (id) => {
    await api.delete(`/movies/${id}`)
    setMovies(prev => prev.filter(m => m.id !== id))
  }, [])

  const restoreMovie = useCallback(async (movie) => {
    if (movies.some(m => m.id === movie.id)) return
    const restored = await api.post('/movies', movie).catch(() => null)
    if (restored) setMovies(prev => [restored, ...prev])
  }, [movies])

  const togglePriority = useCallback(async (id) => {
    const movie = movies.find(m => m.id === id)
    if (!movie) return
    await updateMovie(id, { priority: !movie.priority })
  }, [movies, updateMovie])

  const markWatched = useCallback(async (id, date) => {
    await updateMovie(id, {
      status: 'vista',
      watchedDate: date || new Date().toISOString().slice(0, 10),
    })
  }, [updateMovie])

  const markPending = useCallback(async (id) => {
    await updateMovie(id, { status: 'pendiente', watchedDate: null })
  }, [updateMovie])

  const exportData = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, exportDate: new Date().toISOString(), movies }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vi_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    localStorage.setItem('vi_last_backup', new Date().toISOString())
  }, [movies])

  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result)
          const raw = Array.isArray(parsed) ? parsed : (parsed.movies ?? [])
          if (!Array.isArray(raw)) throw new Error('Formato inválido')
          const list = raw
            .filter(m => m && typeof m.title === 'string' && m.title.trim())
            .map(m => ({
              ...m,
              year: m.year != null ? (parseInt(m.year, 10) || null) : null,
              rating: typeof m.rating === 'number' ? Math.max(0, Math.min(5, Math.round(m.rating))) : 0,
              status: m.status === 'vista' || m.status === 'pendiente' ? m.status : 'pendiente',
              genres: Array.isArray(m.genres) ? m.genres.filter(g => typeof g === 'string') : [],
            }))
          if (list.length === 0) throw new Error('No se encontraron películas válidas')

          const current = moviesRef.current
          const toImport = list.filter(m => {
            if (m.tmdbId && current.some(c => c.tmdbId === m.tmdbId)) return false
            if (current.some(c =>
              c.title?.toLowerCase() === m.title?.toLowerCase() && c.year === m.year
            )) return false
            return true
          })
          const skipped = list.length - toImport.length

          if (toImport.length === 0) throw new Error('Todas las películas ya existen en tu biblioteca')

          const results = await Promise.all(toImport.map(m => api.post('/movies', m)))
          setMovies(prev => [...results, ...prev])
          resolve({ imported: results.length, skipped })
        } catch (err) {
          reject(new Error(err.message || 'Archivo inválido'))
        }
      }
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsText(file)
    })
  }, [])

  const stats = useMemo(() => {
    const watched = movies.filter(m => m.status === 'vista')
    const pending = movies.filter(m => m.status === 'pendiente')
    const rated = watched.filter(m => m.rating > 0)
    const avgRating = rated.length
      ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1) : 0
    const totalMinutes = watched.reduce((s, m) => s + (m.runtime || 0), 0)

    const genreCount = {}
    watched.forEach(m => (m.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1 }))

    const directorCount = {}
    watched.forEach(m => { if (m.director) directorCount[m.director] = (directorCount[m.director] || 0) + 1 })

    const monthlyCount = {}
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyCount[key] = 0
    }
    watched.forEach(m => {
      if (m.watchedDate) {
        const key = String(m.watchedDate).slice(0, 7)
        if (key in monthlyCount) monthlyCount[key]++
      }
    })

    return {
      total: movies.length,
      watched: watched.length,
      pending: pending.length,
      avgRating: Number(avgRating),
      totalMinutes,
      topGenres: Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 6),
      topDirectors: Object.entries(directorCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topRated: [...watched].filter(m => m.rating > 0)
        .sort((a, b) => b.rating - a.rating).slice(0, 5),
      monthlyCount,
    }
  }, [movies])

  const uniqueGenres = useMemo(() => {
    const set = new Set()
    movies.forEach(m => (m.genres || []).forEach(g => set.add(g)))
    return [...set].sort()
  }, [movies])

  const uniqueDirectors = useMemo(() => {
    const set = new Set()
    movies.forEach(m => m.director && set.add(m.director))
    return [...set].sort()
  }, [movies])

  return {
    movies, loading, loadError, addMovie, updateMovie, deleteMovie,
    restoreMovie, togglePriority, markWatched, markPending,
    exportData, importData, stats, uniqueGenres, uniqueDirectors,
  }
}
