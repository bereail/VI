import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LibraryPage } from '../pages/LibraryPage'

vi.mock('../hooks/useMovieSearch', () => ({
  fetchTrending: vi.fn().mockReturnValue(new Promise(() => {})),
  getMovieDetails: vi.fn(),
  hasApiKey: vi.fn().mockReturnValue(false),
  useMovieSearch: vi.fn().mockReturnValue({ results: [], loading: false, error: null, search: vi.fn(), clear: vi.fn() }),
  getTmdbGenres: vi.fn().mockResolvedValue([]),
  fetchDiscover: vi.fn().mockReturnValue(new Promise(() => {})),
}))

const noop = () => {}

const baseProps = {
  movies: [],
  uniqueGenres: [],
  uniqueDirectors: [],
  stats: { watched: 0, pending: 0, total: 0 },
  user: { email: 'test@test.com' },
  onEdit: noop,
  onDelete: noop,
  onMarkWatched: noop,
  onMarkPending: noop,
  onRate: noop,
  onAdd: noop,
  onSearchTmdb: noop,
  onAddFromDiscover: noop,
  onStats: noop,
  onExport: noop,
  onImport: noop,
  onToggleTheme: noop,
  theme: 'dark',
  onApiKey: noop,
  onLogout: noop,
  onTogglePriority: noop,
  onOpenAdmin: null,
}

const sampleMovies = [
  { id: '1', title: 'Inception', year: 2010, status: 'pendiente', addedDate: '2025-01-01T00:00:00Z', genres: ['Ciencia ficción'] },
  { id: '2', title: 'Dune', year: 2021, status: 'vista', addedDate: '2025-01-02T00:00:00Z', genres: ['Ciencia ficción'], rating: 4 },
]

describe('LibraryPage - sort persistido', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('persiste el sort en localStorage al cambiar', () => {
    render(<LibraryPage {...baseProps} movies={sampleMovies} />)
    const sortSelect = screen.getByRole('combobox', { name: /Ordenar/i })
    fireEvent.change(sortSelect, { target: { value: 'title' } })
    expect(localStorage.getItem('vi_sort')).toBe('title')
  })

  it('restaura el sort desde localStorage al montar', () => {
    localStorage.setItem('vi_sort', 'rating')
    render(<LibraryPage {...baseProps} movies={sampleMovies} />)
    const sortSelect = screen.getByRole('combobox', { name: /Ordenar/i })
    expect(sortSelect.value).toBe('rating')
  })

  it('usa "recent" como valor por defecto si no hay localStorage', () => {
    render(<LibraryPage {...baseProps} />)
    const sortSelect = screen.getByRole('combobox', { name: /Ordenar/i })
    expect(sortSelect.value).toBe('recent')
  })
})

describe('LibraryPage - búsqueda por año', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('filtra películas por año', async () => {
    render(<LibraryPage {...baseProps} movies={sampleMovies} />)
    const searchInput = screen.getByPlaceholderText(/Buscar/)
    fireEvent.change(searchInput, { target: { value: '2010' } })
    await waitFor(() => {
      expect(screen.queryAllByText('Dune')).toHaveLength(0)
    })
    expect(screen.queryAllByText('Inception').length).toBeGreaterThan(0)
  })

  it('muestra todas las películas sin filtro de año', () => {
    render(<LibraryPage {...baseProps} movies={sampleMovies} />)
    expect(screen.queryAllByText('Inception').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Dune').length).toBeGreaterThan(0)
  })
})

describe('LibraryPage - empty state', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('muestra el empty state cuando no hay películas', () => {
    render(<LibraryPage {...baseProps} movies={[]} />)
    expect(screen.getByText('Buscar en TMDB')).toBeInTheDocument()
    expect(screen.getByText('Agregar manual')).toBeInTheDocument()
  })

  it('muestra mensaje de sin resultados cuando hay películas pero no coincide la búsqueda', async () => {
    render(<LibraryPage {...baseProps} movies={sampleMovies} />)
    const searchInput = screen.getByPlaceholderText(/Buscar/)
    fireEvent.change(searchInput, { target: { value: 'xyzxyz123' } })
    await waitFor(() => {
      expect(screen.getByText(/Sin resultados/)).toBeInTheDocument()
    })
  })
})

describe('LibraryPage - atajo de teclado', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('el label del atajo "/" dice "buscar"', () => {
    render(<LibraryPage {...baseProps} />)
    const shortcutText = screen.getByText('buscar')
    expect(shortcutText).toBeInTheDocument()
  })
})
