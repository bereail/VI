import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMovies, checkBackupReminder } from '../hooks/useMovies'

const EMAIL = 'test@vi.com'

// Stateful fetch mock that simulates the backend
const mockDB = {}
let idSeq = 0

function makeFetch() {
  return vi.fn((url, opts = {}) => {
    const method = opts.method || 'GET'
    const path = String(url).replace('/vi-api', '')

    if (method === 'GET') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(Object.values(mockDB)) })
    }
    if (method === 'POST') {
      const body = JSON.parse(opts.body || '{}')
      const movie = { ...body, id: String(++idSeq) }
      mockDB[movie.id] = movie
      return Promise.resolve({ ok: true, json: () => Promise.resolve(movie) })
    }
    if (method === 'PUT') {
      const id = path.split('/').pop()
      mockDB[id] = { ...mockDB[id], ...JSON.parse(opts.body || '{}') }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDB[id]) })
    }
    if (method === 'DELETE') {
      const id = path.split('/').pop()
      delete mockDB[id]
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
  })
}

beforeEach(() => {
  localStorage.clear()
  Object.keys(mockDB).forEach(k => delete mockDB[k])
  idSeq = 0
  global.fetch = makeFetch()
})

async function setupHook(email = EMAIL) {
  const hook = renderHook(() => useMovies(email))
  // flush initial useEffect (migration + GET /movies)
  await act(async () => {})
  return hook
}

describe('useMovies', () => {
  it('starts with empty list', async () => {
    const { result } = await setupHook()
    expect(result.current.movies).toEqual([])
  })

  it('addMovie creates a movie with defaults', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Inception', director: 'Nolan' }) })
    expect(result.current.movies).toHaveLength(1)
    expect(result.current.movies[0]).toMatchObject({
      title: 'Inception',
      director: 'Nolan',
      status: 'pendiente',
      rating: 0,
    })
    expect(result.current.movies[0].id).toBeTruthy()
    expect(result.current.movies[0].addedDate).toBeTruthy()
  })

  it('different users have separate storage', async () => {
    const h1 = await setupHook('user1@test.com')
    const h2 = await setupHook('user2@test.com')
    await act(async () => { await h1.result.current.addMovie({ title: 'User1 Movie' }) })
    expect(h1.result.current.movies).toHaveLength(1)
    // h2 started with empty DB and didn't call addMovie
    expect(h2.result.current.movies).toHaveLength(0)
  })

  it('updateMovie changes fields', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Dune' }) })
    const id = result.current.movies[0].id
    await act(async () => { await result.current.updateMovie(id, { rating: 5, notes: 'Épica' }) })
    expect(result.current.movies[0].rating).toBe(5)
    expect(result.current.movies[0].notes).toBe('Épica')
  })

  it('deleteMovie removes the movie', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Avatar' }) })
    const id = result.current.movies[0].id
    await act(async () => { await result.current.deleteMovie(id) })
    expect(result.current.movies).toHaveLength(0)
  })

  it('markWatched sets status to vista', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Interstellar' }) })
    const id = result.current.movies[0].id
    await act(async () => { await result.current.markWatched(id, '2025-01-15') })
    expect(result.current.movies[0].status).toBe('vista')
    expect(result.current.movies[0].watchedDate).toBe('2025-01-15')
  })

  it('markPending resets status', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Parasite', status: 'vista', watchedDate: '2025-01-01' }) })
    const id = result.current.movies[0].id
    await act(async () => { await result.current.markPending(id) })
    expect(result.current.movies[0].status).toBe('pendiente')
    expect(result.current.movies[0].watchedDate).toBeNull()
  })

  it('multiple movies are sorted newest first', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Primero' }) })
    await act(async () => { await result.current.addMovie({ title: 'Segundo' }) })
    expect(result.current.movies[0].title).toBe('Segundo')
  })

  it('stats are computed correctly', async () => {
    const { result } = await setupHook()
    await act(async () => {
      await result.current.addMovie({ title: 'A', status: 'vista', rating: 4, genres: ['Drama'], director: 'Dir1', runtime: 120, watchedDate: '2025-06-01' })
      await result.current.addMovie({ title: 'B', status: 'vista', rating: 2, genres: ['Drama', 'Comedia'], director: 'Dir1', runtime: 90, watchedDate: '2025-06-05' })
      await result.current.addMovie({ title: 'C', status: 'pendiente' })
    })
    const { stats } = result.current
    expect(stats.watched).toBe(2)
    expect(stats.pending).toBe(1)
    expect(stats.total).toBe(3)
    expect(stats.avgRating).toBe(3)
    expect(stats.totalMinutes).toBe(210)
    expect(stats.topGenres[0][0]).toBe('Drama')
    expect(stats.topGenres[0][1]).toBe(2)
    expect(stats.topDirectors[0][0]).toBe('Dir1')
    expect(stats.topDirectors[0][1]).toBe(2)
  })

  it('uniqueGenres returns sorted unique genres', async () => {
    const { result } = await setupHook()
    await act(async () => {
      await result.current.addMovie({ title: 'X', genres: ['Terror', 'Acción'] })
      await result.current.addMovie({ title: 'Y', genres: ['Acción', 'Drama'] })
    })
    expect(result.current.uniqueGenres).toEqual(['Acción', 'Drama', 'Terror'])
  })

  it('uniqueDirectors returns sorted unique directors', async () => {
    const { result } = await setupHook()
    await act(async () => {
      await result.current.addMovie({ title: 'A', director: 'Villeneuve' })
      await result.current.addMovie({ title: 'B', director: 'Nolan' })
      await result.current.addMovie({ title: 'C', director: 'Villeneuve' })
    })
    expect(result.current.uniqueDirectors).toEqual(['Nolan', 'Villeneuve'])
  })

  it('importData merges with existing movies', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Viejo', year: 1999 }) })
    expect(result.current.movies).toHaveLength(1)

    const json = JSON.stringify([{ title: 'Importado', status: 'pendiente', addedDate: new Date().toISOString() }])
    const file = new File([json], 'backup.json', { type: 'application/json' })

    let importResult
    await act(async () => { importResult = await result.current.importData(file) })

    expect(importResult.imported).toBe(1)
    expect(importResult.skipped).toBe(0)
    expect(result.current.movies).toHaveLength(2)
    expect(result.current.movies.some(m => m.title === 'Importado')).toBe(true)
    expect(result.current.movies.some(m => m.title === 'Viejo')).toBe(true)
  })

  it('importData deduplicates by tmdbId', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Matrix', tmdbId: 603, year: 1999 }) })

    const json = JSON.stringify([
      { title: 'Matrix duplicado', tmdbId: 603, status: 'pendiente' },
      { title: 'Matrix Reloaded', tmdbId: 604, status: 'pendiente' },
    ])
    const file = new File([json], 'backup.json', { type: 'application/json' })

    let importResult
    await act(async () => { importResult = await result.current.importData(file) })

    expect(importResult.imported).toBe(1)
    expect(importResult.skipped).toBe(1)
    expect(result.current.movies).toHaveLength(2)
  })

  it('importData deduplicates by title + year', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Inception', year: 2010 }) })

    const json = JSON.stringify([
      { title: 'Inception', year: 2010, status: 'pendiente' },
      { title: 'Dune', year: 2021, status: 'pendiente' },
    ])
    const file = new File([json], 'backup.json', { type: 'application/json' })

    let importResult
    await act(async () => { importResult = await result.current.importData(file) })

    expect(importResult.imported).toBe(1)
    expect(importResult.skipped).toBe(1)
  })

  it('importData throws when all movies already exist', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Matrix', tmdbId: 603 }) })

    const json = JSON.stringify([{ title: 'Matrix dup', tmdbId: 603, status: 'pendiente' }])
    const file = new File([json], 'backup.json', { type: 'application/json' })

    await act(async () => {
      await expect(result.current.importData(file)).rejects.toThrow('ya existen')
    })
  })

  it('importData handles {movies:[]} format', async () => {
    const { result } = await setupHook()
    const json = JSON.stringify({ version: 1, movies: [{ title: 'Del formato', status: 'pendiente', addedDate: new Date().toISOString() }] })
    const file = new File([json], 'backup.json', { type: 'application/json' })
    await act(async () => { await result.current.importData(file) })
    expect(result.current.movies[0].title).toBe('Del formato')
  })

  it('stats avgRating is 0 when no rated movies', async () => {
    const { result } = await setupHook()
    await act(async () => { await result.current.addMovie({ title: 'Sin nota', status: 'vista', rating: 0, watchedDate: '2025-01-01' }) })
    expect(result.current.stats.avgRating).toBe(0)
  })

  it('exportData sets vi_last_backup in localStorage', async () => {
    const { result } = await setupHook()
    await act(async () => { result.current.exportData() })
    expect(localStorage.getItem('vi_last_backup')).toBeTruthy()
  })
})

describe('checkBackupReminder', () => {
  beforeEach(() => localStorage.clear())

  it('returns true when no backup has been made', () => {
    expect(checkBackupReminder()).toBe(true)
  })

  it('returns false when backup was made today', () => {
    localStorage.setItem('vi_last_backup', new Date().toISOString())
    expect(checkBackupReminder()).toBe(false)
  })

  it('returns true when backup was made more than 7 days ago', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem('vi_last_backup', old)
    expect(checkBackupReminder()).toBe(true)
  })
})
