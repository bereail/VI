import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMovies } from '../hooks/useMovies'

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

async function setup() {
  const hook = renderHook(() => useMovies())
  await act(async () => {})
  return hook
}

describe('stats - monthly distribution', () => {
  it('includes last 12 months in monthlyCount', async () => {
    const { result } = await setup()
    const keys = Object.keys(result.current.stats.monthlyCount)
    expect(keys).toHaveLength(12)
  })

  it('counts watched movies in correct month', async () => {
    const { result } = await setup()
    const thisMonth = new Date().toISOString().slice(0, 7)
    await act(async () => {
      await result.current.addMovie({ title: 'A', status: 'vista', watchedDate: `${thisMonth}-10`, runtime: 0 })
      await result.current.addMovie({ title: 'B', status: 'vista', watchedDate: `${thisMonth}-15`, runtime: 0 })
    })
    expect(result.current.stats.monthlyCount[thisMonth]).toBe(2)
  })

  it('does not count pending movies', async () => {
    const { result } = await setup()
    const thisMonth = new Date().toISOString().slice(0, 7)
    await act(async () => {
      await result.current.addMovie({ title: 'Pending', status: 'pendiente' })
    })
    expect(result.current.stats.monthlyCount[thisMonth]).toBe(0)
  })
})

describe('stats - topRated', () => {
  it('topRated returns max 5 movies by rating desc', async () => {
    const { result } = await setup()
    await act(async () => {
      for (let i = 1; i <= 7; i++) {
        await result.current.addMovie({ title: `Peli ${i}`, status: 'vista', rating: i > 5 ? 3 : i, watchedDate: '2025-01-01' })
      }
    })
    const { topRated } = result.current.stats
    expect(topRated).toHaveLength(5)
    expect(topRated[0].rating).toBeGreaterThanOrEqual(topRated[1].rating)
  })

  it('topRated excludes unrated movies', async () => {
    const { result } = await setup()
    await act(async () => {
      await result.current.addMovie({ title: 'Sin rating', status: 'vista', rating: 0, watchedDate: '2025-01-01' })
      await result.current.addMovie({ title: 'Con rating', status: 'vista', rating: 4, watchedDate: '2025-01-01' })
    })
    expect(result.current.stats.topRated).toHaveLength(1)
    expect(result.current.stats.topRated[0].title).toBe('Con rating')
  })
})

describe('stats - totalMinutes', () => {
  it('sums runtime of watched movies only', async () => {
    const { result } = await setup()
    await act(async () => {
      await result.current.addMovie({ title: 'A', status: 'vista', runtime: 100, watchedDate: '2025-01-01' })
      await result.current.addMovie({ title: 'B', status: 'pendiente', runtime: 200 })
      await result.current.addMovie({ title: 'C', status: 'vista', runtime: 90, watchedDate: '2025-01-02' })
    })
    expect(result.current.stats.totalMinutes).toBe(190)
  })

  it('handles missing runtime gracefully', async () => {
    const { result } = await setup()
    await act(async () => {
      await result.current.addMovie({ title: 'Sin duración', status: 'vista', watchedDate: '2025-01-01' })
    })
    expect(result.current.stats.totalMinutes).toBe(0)
  })
})

describe('stats - genre and director counts', () => {
  it('counts genres only from watched movies', async () => {
    const { result } = await setup()
    await act(async () => {
      await result.current.addMovie({ title: 'Vista', status: 'vista', genres: ['Drama'], watchedDate: '2025-01-01' })
      await result.current.addMovie({ title: 'Pendiente', status: 'pendiente', genres: ['Drama'] })
    })
    expect(result.current.stats.topGenres[0]).toEqual(['Drama', 1])
  })

  it('topGenres is sorted by count descending', async () => {
    const { result } = await setup()
    await act(async () => {
      await result.current.addMovie({ title: 'A', status: 'vista', genres: ['Comedia'], watchedDate: '2025-01-01' })
      await result.current.addMovie({ title: 'B', status: 'vista', genres: ['Drama'], watchedDate: '2025-01-01' })
      await result.current.addMovie({ title: 'C', status: 'vista', genres: ['Drama'], watchedDate: '2025-01-01' })
    })
    expect(result.current.stats.topGenres[0][0]).toBe('Drama')
    expect(result.current.stats.topGenres[0][1]).toBe(2)
  })
})
