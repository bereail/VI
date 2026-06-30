import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MovieRow } from '../components/MovieRow'

const baseMovie = {
  id: '1',
  title: 'Blade Runner',
  year: 1982,
  director: 'Ridley Scott',
  genres: ['Ciencia ficción', 'Thriller'],
  poster: null,
  coverColor: '#1a2a4a',
  status: 'vista',
  rating: 4,
  runtime: 117,
  priority: false,
}

const noop = () => {}

function renderRow(overrides = {}, handlers = {}) {
  return render(
    <MovieRow
      movie={{ ...baseMovie, ...overrides }}
      onEdit={handlers.onEdit || noop}
      onDelete={handlers.onDelete || noop}
      onMarkWatched={handlers.onMarkWatched || noop}
      onMarkPending={handlers.onMarkPending || noop}
      onRate={handlers.onRate || noop}
      onTogglePriority={handlers.onTogglePriority || noop}
    />
  )
}

describe('MovieRow', () => {
  it('muestra el título y el año', () => {
    renderRow()
    expect(screen.getByText('Blade Runner')).toBeInTheDocument()
    expect(screen.getByText('1982')).toBeInTheDocument()
  })

  it('muestra badge "Vista" para películas vistas', () => {
    renderRow({ status: 'vista' })
    expect(screen.getByText('✓ Vista')).toBeInTheDocument()
  })

  it('muestra badge "Pendiente" para películas pendientes', () => {
    renderRow({ status: 'pendiente' })
    expect(screen.getByText('◷ Pendiente')).toBeInTheDocument()
  })

  it('muestra las iniciales cuando no hay poster', () => {
    renderRow({ poster: null, title: 'Blade Runner' })
    expect(screen.getByText('BR')).toBeInTheDocument()
  })

  it('muestra la imagen del poster cuando existe', () => {
    renderRow({ poster: 'https://example.com/blade.jpg' })
    const img = screen.getByRole('img', { name: 'Blade Runner' })
    expect(img).toHaveAttribute('src', 'https://example.com/blade.jpg')
  })

  it('muestra el runtime formateado', () => {
    renderRow({ runtime: 117 })
    expect(screen.getByText('1h 57min')).toBeInTheDocument()
  })

  it('no muestra runtime si no está definido', () => {
    renderRow({ runtime: null })
    expect(screen.queryByText(/min/)).toBeNull()
  })

  it('muestra los géneros (hasta 2)', () => {
    renderRow({ genres: ['Drama', 'Comedia', 'Thriller'] })
    expect(screen.getByText('Drama')).toBeInTheDocument()
    expect(screen.getByText('Comedia')).toBeInTheDocument()
    expect(screen.queryByText('Thriller')).toBeNull()
  })

  it('llama a onEdit al hacer clic en Editar', () => {
    const onEdit = vi.fn()
    renderRow({}, { onEdit })
    fireEvent.click(screen.getByLabelText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
  })

  it('llama a onDelete al hacer clic en Eliminar', () => {
    const onDelete = vi.fn()
    renderRow({}, { onDelete })
    fireEvent.click(screen.getByLabelText('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('llama a onMarkPending para películas vistas', () => {
    const onMarkPending = vi.fn()
    renderRow({ status: 'vista' }, { onMarkPending })
    fireEvent.click(screen.getByLabelText('Mover a pendientes'))
    expect(onMarkPending).toHaveBeenCalledWith('1')
  })

  it('llama a onMarkWatched para películas pendientes', () => {
    const onMarkWatched = vi.fn()
    renderRow({ status: 'pendiente' }, { onMarkWatched })
    fireEvent.click(screen.getByLabelText('Marcar como vista'))
    expect(onMarkWatched).toHaveBeenCalledWith('1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('llama a onTogglePriority para pendientes', () => {
    const onTogglePriority = vi.fn()
    renderRow({ status: 'pendiente' }, { onTogglePriority })
    fireEvent.click(screen.getByLabelText('Prioridad'))
    expect(onTogglePriority).toHaveBeenCalledWith('1')
  })

  it('no muestra el botón de prioridad para películas vistas', () => {
    renderRow({ status: 'vista' })
    expect(screen.queryByLabelText('Prioridad')).toBeNull()
  })

  it('muestra la estrella de prioridad cuando priority=true', () => {
    const { container } = renderRow({ status: 'pendiente', priority: true })
    expect(container.querySelector('[class*="priorityDot"]')).toBeInTheDocument()
  })

  it('llama a onRate al cambiar la puntuación', () => {
    const onRate = vi.fn()
    renderRow({}, { onRate })
    fireEvent.click(screen.getByLabelText('3 estrellas'))
    expect(onRate).toHaveBeenCalledWith('1', 3)
  })
})
