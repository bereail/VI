import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatsModal } from '../components/StatsModal'

const emptyStats = {
  watched: 0,
  pending: 0,
  total: 0,
  avgRating: 0,
  totalMinutes: 0,
  topGenres: [],
  topDirectors: [],
  topRated: [],
  monthlyCount: {},
}

const fullStats = {
  watched: 12,
  pending: 5,
  total: 17,
  avgRating: 3.8,
  totalMinutes: 1440,
  topGenres: [['Drama', 6], ['Comedia', 3], ['Thriller', 2]],
  topDirectors: [['Nolan', 4], ['Villeneuve', 3]],
  topRated: [
    { id: '1', title: 'Inception', year: 2010, rating: 5, poster: null },
    { id: '2', title: 'Dune', year: 2021, rating: 4, poster: null },
  ],
  monthlyCount: {
    '2025-01': 2, '2025-02': 1, '2025-03': 3,
    '2025-04': 0, '2025-05': 2, '2025-06': 1,
    '2025-07': 0, '2025-08': 1, '2025-09': 0,
    '2025-10': 0, '2025-11': 1, '2025-12': 1,
  },
}

describe('StatsModal', () => {
  it('cierra al hacer clic en el botón cerrar', () => {
    const onClose = vi.fn()
    render(<StatsModal stats={emptyStats} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Cerrar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('cierra al hacer clic en el backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(<StatsModal stats={emptyStats} onClose={onClose} />)
    fireEvent.click(container.querySelector('.modal-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('muestra el título "Estadísticas"', () => {
    render(<StatsModal stats={emptyStats} onClose={() => {}} />)
    expect(screen.getByText('Estadísticas')).toBeInTheDocument()
  })

  it('muestra los números del resumen', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  it('muestra el tiempo total formateado en horas', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('24h')).toBeInTheDocument()
  })

  it('muestra "—" cuando no hay películas vistas (tiempo 0 y sin promedio)', () => {
    render(<StatsModal stats={emptyStats} onClose={() => {}} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('muestra el mensaje de estado vacío cuando watched = 0', () => {
    render(<StatsModal stats={emptyStats} onClose={() => {}} />)
    expect(screen.getByText(/no marcaste películas/)).toBeInTheDocument()
  })

  it('muestra la sección de géneros favoritos', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('Géneros favoritos')).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
    expect(screen.getByText('Comedia')).toBeInTheDocument()
  })

  it('muestra la sección de directores más vistos', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('Directores más vistos')).toBeInTheDocument()
    expect(screen.getByText('Nolan')).toBeInTheDocument()
    expect(screen.getByText('Villeneuve')).toBeInTheDocument()
  })

  it('muestra la sección de mejor puntuadas', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('Mejor puntuadas')).toBeInTheDocument()
    expect(screen.getByText('Inception')).toBeInTheDocument()
    expect(screen.getByText('Dune')).toBeInTheDocument()
  })

  it('muestra los rankings con #', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
  })

  it('no muestra secciones cuando watched = 0', () => {
    render(<StatsModal stats={emptyStats} onClose={() => {}} />)
    expect(screen.queryByText('Géneros favoritos')).toBeNull()
    expect(screen.queryByText('Directores más vistos')).toBeNull()
    expect(screen.queryByText('Mejor puntuadas')).toBeNull()
  })

  it('muestra la sección de películas por mes', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('Películas por mes')).toBeInTheDocument()
  })

  it('muestra el promedio cuando hay películas puntuadas', () => {
    render(<StatsModal stats={fullStats} onClose={() => {}} />)
    expect(screen.getByText('3.8')).toBeInTheDocument()
  })

  it('muestra "—" como promedio cuando avgRating = 0', () => {
    render(<StatsModal stats={{ ...emptyStats, watched: 3, total: 3 }} onClose={() => {}} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})
