import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MovieCard } from '../components/MovieCard'

const mockMovie = {
  id: '1',
  title: 'Inception',
  year: 2010,
  director: 'Christopher Nolan',
  genres: ['Ciencia ficción', 'Thriller'],
  poster: null,
  coverColor: '#1a2a4a',
  overview: 'Un ladrón que roba secretos corporativos.',
  status: 'vista',
  rating: 5,
  watchedDate: '2025-01-10',
  notes: 'Película increíble',
}

const noop = () => {}

function renderCard(overrides = {}) {
  return render(
    <MovieCard
      movie={{ ...mockMovie, ...overrides }}
      onEdit={noop}
      onDelete={noop}
      onMarkWatched={noop}
      onMarkPending={noop}
      onRate={noop}
    />
  )
}

describe('MovieCard', () => {
  it('renders the movie title', () => {
    renderCard()
    expect(screen.getAllByText('Inception').length).toBeGreaterThanOrEqual(1)
  })

  it('shows watched badge for vista status', () => {
    renderCard({ status: 'vista' })
    expect(screen.getByText('✓ Vista')).toBeInTheDocument()
  })

  it('shows pending badge for pendiente status', () => {
    renderCard({ status: 'pendiente' })
    expect(screen.getByText('◷ Pendiente')).toBeInTheDocument()
  })

  it('shows placeholder initials when no poster', () => {
    renderCard({ poster: null, title: 'Sin Poster' })
    expect(screen.getByText('SP')).toBeInTheDocument()
  })

  it('applies coverColor to placeholder', () => {
    const { container } = renderCard({ poster: null, coverColor: '#ff0000' })
    const placeholder = container.querySelector('[class*="placeholder"]')
    expect(placeholder).toHaveStyle({ background: '#ff0000' })
  })

  it('shows poster image when provided', () => {
    renderCard({ poster: 'https://example.com/poster.jpg' })
    const img = screen.getByRole('img', { name: 'Inception' })
    expect(img).toHaveAttribute('src', 'https://example.com/poster.jpg')
  })

  it('flips card on click', () => {
    const { container } = renderCard()
    const wrapper = container.querySelector('[role="button"]')
    expect(container.querySelector('[class*="flipped"]')).toBeNull()
    fireEvent.click(wrapper)
    expect(container.querySelector('[class*="flipped"]')).toBeTruthy()
  })

  it('flips card on Enter key', () => {
    const { container } = renderCard()
    const wrapper = container.querySelector('[role="button"]')
    fireEvent.keyDown(wrapper, { key: 'Enter' })
    expect(container.querySelector('[class*="flipped"]')).toBeTruthy()
  })

  it('flips card on Space key', () => {
    const { container } = renderCard()
    const wrapper = container.querySelector('[role="button"]')
    fireEvent.keyDown(wrapper, { key: ' ' })
    expect(container.querySelector('[class*="flipped"]')).toBeTruthy()
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    const { container } = render(
      <MovieCard movie={mockMovie} onEdit={onEdit} onDelete={noop} onMarkWatched={noop} onMarkPending={noop} onRate={noop} />
    )
    fireEvent.click(container.querySelector('[role="button"]'))
    fireEvent.click(screen.getByLabelText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(mockMovie)
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    const { container } = render(
      <MovieCard movie={mockMovie} onEdit={noop} onDelete={onDelete} onMarkWatched={noop} onMarkPending={noop} onRate={noop} />
    )
    fireEvent.click(container.querySelector('[role="button"]'))
    fireEvent.click(screen.getByLabelText('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onMarkPending for watched movie', () => {
    const onMarkPending = vi.fn()
    const { container } = render(
      <MovieCard movie={{ ...mockMovie, status: 'vista' }} onEdit={noop} onDelete={noop} onMarkWatched={noop} onMarkPending={onMarkPending} onRate={noop} />
    )
    fireEvent.click(container.querySelector('[role="button"]'))
    fireEvent.click(screen.getByLabelText('Mover a pendientes'))
    expect(onMarkPending).toHaveBeenCalledWith('1')
  })

  it('opens date picker when mark-as-watched clicked', () => {
    const onMarkWatched = vi.fn()
    const { container } = render(
      <MovieCard movie={{ ...mockMovie, status: 'pendiente' }} onEdit={noop} onDelete={noop} onMarkWatched={onMarkWatched} onMarkPending={noop} onRate={noop} />
    )
    fireEvent.click(container.querySelector('[role="button"]'))
    fireEvent.click(screen.getByLabelText('Marcar como vista'))
    // Clicking the button opens the date picker; confirm triggers onMarkWatched
    fireEvent.click(screen.getByLabelText('Confirmar fecha'))
    expect(onMarkWatched).toHaveBeenCalledWith('1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('shows director in back', () => {
    const { container } = renderCard()
    fireEvent.click(container.querySelector('[role="button"]'))
    expect(screen.getByText(/Christopher Nolan/)).toBeInTheDocument()
  })

  it('does not show runtime in back', () => {
    const { container } = renderCard({ runtime: 148 })
    fireEvent.click(container.querySelector('[role="button"]'))
    expect(screen.queryByText(/148 min/)).toBeNull()
  })

  it('shows notes when present', () => {
    const { container } = renderCard()
    fireEvent.click(container.querySelector('[role="button"]'))
    expect(screen.getByText(/"Película increíble"/)).toBeInTheDocument()
  })

  it('shows genre tags in back', () => {
    const { container } = renderCard()
    fireEvent.click(container.querySelector('[role="button"]'))
    expect(screen.getByText('Ciencia ficción')).toBeInTheDocument()
    expect(screen.getByText('Thriller')).toBeInTheDocument()
  })

  it('calls onRate when star clicked', () => {
    const onRate = vi.fn()
    const { container } = render(
      <MovieCard movie={mockMovie} onEdit={noop} onDelete={noop} onMarkWatched={noop} onMarkPending={noop} onRate={onRate} />
    )
    fireEvent.click(container.querySelector('[role="button"]'))
    fireEvent.click(screen.getByLabelText('3 estrellas'))
    expect(onRate).toHaveBeenCalledWith('1', 3)
  })
})
