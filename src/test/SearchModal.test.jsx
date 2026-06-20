import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchModal } from '../components/SearchModal'
import * as movieSearchModule from '../hooks/useMovieSearch'

beforeEach(() => {
  vi.restoreAllMocks()
})

const mockHook = (overrides = {}) => ({
  results: [],
  loading: false,
  error: null,
  search: vi.fn(),
  getDetails: vi.fn(),
  clear: vi.fn(),
  ...overrides,
})

describe('SearchModal', () => {
  it('renders search input', () => {
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook())
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    expect(screen.getByPlaceholderText(/Buscar película en TMDB/)).toBeInTheDocument()
  })

  it('calls search when typing', () => {
    const search = vi.fn()
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ search }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar película en TMDB/)
    fireEvent.change(input, { target: { value: 'Matrix' } })
    expect(search).toHaveBeenCalledWith('Matrix')
  })

  it('calls onClose when Escape pressed', () => {
    const onClose = vi.fn()
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook())
    render(<SearchModal onSelect={() => {}} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ loading: true }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    expect(screen.getByText(/Buscando/)).toBeInTheDocument()
  })

  it('shows error message', () => {
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ error: 'Configurá tu API key de TMDB en ajustes.' }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    expect(screen.getByText(/Configurá tu API key/)).toBeInTheDocument()
  })

  it('shows results', () => {
    const results = [
      { tmdbId: 1, title: 'Matrix', originalTitle: 'The Matrix', year: 1999, genres: ['Ciencia ficción'], poster: null, overview: '' },
    ]
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ results }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    expect(screen.getByText('Matrix')).toBeInTheDocument()
  })

  it('calls onSelect with details when result clicked', async () => {
    const onSelect = vi.fn()
    const movie = { tmdbId: 99, title: 'Dune', originalTitle: 'Dune', year: 2021, genres: [], poster: null, overview: '' }
    const details = { ...movie, director: 'Villeneuve', runtime: 155 }
    const getDetails = vi.fn().mockResolvedValue(details)
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ results: [movie], getDetails }))
    render(<SearchModal onSelect={onSelect} onClose={() => {}} />)
    fireEvent.click(screen.getByText('Dune'))
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(details))
  })

  it('shows empty results message after typing', () => {
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ results: [] }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar película en TMDB/)
    fireEvent.change(input, { target: { value: 'xyzxyz' } })
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument()
  })
})
