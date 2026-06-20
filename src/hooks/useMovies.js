import { useState, useCallback, useMemo } from 'react'

function storageKey(email) {
  return `vi_movies_${email}`
}

function load(email) {
  try {
    const raw = localStorage.getItem(storageKey(email))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(email, movies) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(movies))
  } catch { /* storage full */ }
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useMovies(userEmail) {
  const [movies, setMovies] = useState(() => load(userEmail))

  const persist = useCallback((updater) => {
    setMovies((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      save(userEmail, next)
      return next
    })
  }, [userEmail])

  const addMovie = useCallback((data) => {
    const movie = {
      id: newId(),
      addedDate: new Date().toISOString(),
      status: 'pendiente',
      rating: 0,
      watchedDate: null,
      notes: '',
      ...data,
    }
    persist((prev) => [movie, ...prev])
    return movie
  }, [persist])

  const updateMovie = useCallback((id, changes) => {
    persist((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)))
  }, [persist])

  const deleteMovie = useCallback((id) => {
    persist((prev) => prev.filter((m) => m.id !== id))
  }, [persist])

  const markWatched = useCallback((id, date) => {
    updateMovie(id, {
      status: 'vista',
      watchedDate: date || new Date().toISOString().slice(0, 10),
    })
  }, [updateMovie])

  const markPending = useCallback((id) => {
    updateMovie(id, { status: 'pendiente', watchedDate: null })
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
  }, [movies])

  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result)
          const list = Array.isArray(parsed) ? parsed : (parsed.movies ?? [])
          persist(list)
          resolve(list.length)
        } catch {
          reject(new Error('Archivo inválido'))
        }
      }
      reader.readAsText(file)
    })
  }, [persist])

  const stats = useMemo(() => {
    const watched = movies.filter((m) => m.status === 'vista')
    const pending = movies.filter((m) => m.status === 'pendiente')
    const rated = watched.filter((m) => m.rating > 0)
    const avgRating = rated.length
      ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1)
      : 0
    const totalMinutes = watched.reduce((s, m) => s + (m.runtime || 0), 0)

    const genreCount = {}
    watched.forEach((m) => {
      ;(m.genres || []).forEach((g) => { genreCount[g] = (genreCount[g] || 0) + 1 })
    })

    const directorCount = {}
    watched.forEach((m) => {
      if (m.director) directorCount[m.director] = (directorCount[m.director] || 0) + 1
    })

    const monthlyCount = {}
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyCount[key] = 0
    }
    watched.forEach((m) => {
      if (m.watchedDate) {
        const key = m.watchedDate.slice(0, 7)
        if (key in monthlyCount) monthlyCount[key]++
      }
    })

    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const topDirectors = Object.entries(directorCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topRated = [...watched]
      .filter((m) => m.rating > 0)
      .sort((a, b) => b.rating - a.rating || new Date(b.watchedDate) - new Date(a.watchedDate))
      .slice(0, 5)

    return {
      total: movies.length,
      watched: watched.length,
      pending: pending.length,
      avgRating: Number(avgRating),
      totalMinutes,
      topGenres,
      topDirectors,
      monthlyCount,
      topRated,
    }
  }, [movies])

  const uniqueGenres = useMemo(() => {
    const set = new Set()
    movies.forEach((m) => (m.genres || []).forEach((g) => set.add(g)))
    return [...set].sort()
  }, [movies])

  const uniqueDirectors = useMemo(() => {
    const set = new Set()
    movies.forEach((m) => m.director && set.add(m.director))
    return [...set].sort()
  }, [movies])

  return {
    movies,
    addMovie,
    updateMovie,
    deleteMovie,
    markWatched,
    markPending,
    exportData,
    importData,
    stats,
    uniqueGenres,
    uniqueDirectors,
  }
}
