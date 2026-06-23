import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchModal } from '../components/SearchModal'
import * as movieSearchModule from '../hooks/useMovieSearch'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(movieSearchModule, 'getTmdbGenres').mockResolvedValue([])
  vi.spyOn(movieSearchModule, 'fetchTrending').mockResolvedValue([])
  vi.spyOn(movieSearchModule, 'fetchDiscover').mockResolvedValue({ results: [], totalPages: 1, page: 1 })
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
    expect(screen.getByPlaceholderText(/Buscar por título/)).toBeInTheDocument()
  })

  it('calls search when typing', () => {
    const search = vi.fn()
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ search }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar por título/)
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

  it('shows loading state while searching', () => {
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ loading: true }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar por título/)
    fireEvent.change(input, { target: { value: 'Matrix' } })
    expect(screen.getByText(/Cargando/)).toBeInTheDocument()
  })

  it('shows error message when search fails', () => {
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(
      mockHook({ error: 'Configurá tu API key de TMDB en ajustes.' })
    )
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar por título/)
    fireEvent.change(input, { target: { value: 'Matrix' } })
    expect(screen.getByText(/Configurá tu API key/)).toBeInTheDocument()
  })

  it('shows results after typing', () => {
    const results = [
      { tmdbId: 1, title: 'Matrix', year: 1999, genres: ['Ciencia ficción'], poster: null, overview: '', tmdbRating: 8.7 },
    ]
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ results }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar por título/)
    fireEvent.change(input, { target: { value: 'Matrix' } })
    expect(screen.getByText('Matrix')).toBeInTheDocument()
  })

  it('calls onSelect with details when result clicked', async () => {
    const onSelect = vi.fn()
    const movie = { tmdbId: 99, title: 'Dune', year: 2021, genres: [], poster: null, overview: '', tmdbRating: null }
    const details = { ...movie, director: 'Villeneuve', runtime: 155 }
    const getDetails = vi.fn().mockResolvedValue(details)
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ results: [movie], getDetails }))
    render(<SearchModal onSelect={onSelect} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar por título/)
    fireEvent.change(input, { target: { value: 'Dune' } })
    fireEvent.click(screen.getByText('Dune'))
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(details))
  })

  it('shows empty results message after typing 2+ characters', () => {
    vi.spyOn(movieSearchModule, 'useMovieSearch').mockReturnValue(mockHook({ results: [] }))
    render(<SearchModal onSelect={() => {}} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/Buscar por título/)
    fireEvent.change(input, { target: { value: 'xyzxyz' } })
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument()
  })
})
