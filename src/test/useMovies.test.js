import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMovies } from '../hooks/useMovies'

const EMAIL = 'test@vi.com'

beforeEach(() => localStorage.clear())

describe('useMovies', () => {
  it('starts with empty list', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    expect(result.current.movies).toEqual([])
  })

  it('addMovie creates a movie with defaults', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Inception', director: 'Nolan' }) })
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

  it('addMovie persists to user-specific localStorage key', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Matrix' }) })
    const saved = JSON.parse(localStorage.getItem(`vi_movies_${EMAIL}`))
    expect(saved).toHaveLength(1)
    expect(saved[0].title).toBe('Matrix')
  })

  it('different users have separate storage', () => {
    const { result: r1 } = renderHook(() => useMovies('user1@test.com'))
    const { result: r2 } = renderHook(() => useMovies('user2@test.com'))
    act(() => { r1.current.addMovie({ title: 'User1 Movie' }) })
    expect(r1.current.movies).toHaveLength(1)
    expect(r2.current.movies).toHaveLength(0)
  })

  it('updateMovie changes fields', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Dune' }) })
    const id = result.current.movies[0].id
    act(() => { result.current.updateMovie(id, { rating: 5, notes: 'Épica' }) })
    expect(result.current.movies[0].rating).toBe(5)
    expect(result.current.movies[0].notes).toBe('Épica')
  })

  it('deleteMovie removes the movie', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Avatar' }) })
    const id = result.current.movies[0].id
    act(() => { result.current.deleteMovie(id) })
    expect(result.current.movies).toHaveLength(0)
  })

  it('markWatched sets status to vista', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Interstellar' }) })
    const id = result.current.movies[0].id
    act(() => { result.current.markWatched(id, '2025-01-15') })
    expect(result.current.movies[0].status).toBe('vista')
    expect(result.current.movies[0].watchedDate).toBe('2025-01-15')
  })

  it('markPending resets status', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Parasite', status: 'vista', watchedDate: '2025-01-01' }) })
    const id = result.current.movies[0].id
    act(() => { result.current.markPending(id) })
    expect(result.current.movies[0].status).toBe('pendiente')
    expect(result.current.movies[0].watchedDate).toBeNull()
  })

  it('multiple movies are sorted newest first', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Primero' }) })
    act(() => { result.current.addMovie({ title: 'Segundo' }) })
    expect(result.current.movies[0].title).toBe('Segundo')
  })

  it('stats are computed correctly', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => {
      result.current.addMovie({ title: 'A', status: 'vista', rating: 4, genres: ['Drama'], director: 'Dir1', runtime: 120, watchedDate: '2025-06-01' })
      result.current.addMovie({ title: 'B', status: 'vista', rating: 2, genres: ['Drama', 'Comedia'], director: 'Dir1', runtime: 90, watchedDate: '2025-06-05' })
      result.current.addMovie({ title: 'C', status: 'pendiente' })
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

  it('uniqueGenres returns sorted unique genres', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => {
      result.current.addMovie({ title: 'X', genres: ['Terror', 'Acción'] })
      result.current.addMovie({ title: 'Y', genres: ['Acción', 'Drama'] })
    })
    expect(result.current.uniqueGenres).toEqual(['Acción', 'Drama', 'Terror'])
  })

  it('uniqueDirectors returns sorted unique directors', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => {
      result.current.addMovie({ title: 'A', director: 'Villeneuve' })
      result.current.addMovie({ title: 'B', director: 'Nolan' })
      result.current.addMovie({ title: 'C', director: 'Villeneuve' })
    })
    expect(result.current.uniqueDirectors).toEqual(['Nolan', 'Villeneuve'])
  })

  it('importData replaces movies list', async () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Viejo' }) })
    const json = JSON.stringify([{ id: 'x', title: 'Importado', status: 'pendiente', addedDate: new Date().toISOString() }])
    const file = new File([json], 'backup.json', { type: 'application/json' })
    await act(async () => {
      const count = await result.current.importData(file)
      expect(count).toBe(1)
    })
    expect(result.current.movies).toHaveLength(1)
    expect(result.current.movies[0].title).toBe('Importado')
  })

  it('importData handles {movies:[]} format', async () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    const json = JSON.stringify({ version: 1, movies: [{ id: 'y', title: 'Del formato', status: 'pendiente', addedDate: new Date().toISOString() }] })
    const file = new File([json], 'backup.json', { type: 'application/json' })
    await act(async () => { await result.current.importData(file) })
    expect(result.current.movies[0].title).toBe('Del formato')
  })

  it('stats avgRating is 0 when no rated movies', () => {
    const { result } = renderHook(() => useMovies(EMAIL))
    act(() => { result.current.addMovie({ title: 'Sin nota', status: 'vista', rating: 0, watchedDate: '2025-01-01' }) })
    expect(result.current.stats.avgRating).toBe(0)
  })
})
