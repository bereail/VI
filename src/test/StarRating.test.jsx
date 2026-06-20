import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StarRating } from '../components/StarRating'

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating value={0} onChange={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('calls onChange with clicked star value', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('3 estrellas'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('clicking active star resets to 0', () => {
    const onChange = vi.fn()
    render(<StarRating value={3} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('3 estrellas'))
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('does not call onChange when readOnly', () => {
    const onChange = vi.fn()
    render(<StarRating value={4} onChange={onChange} readOnly />)
    fireEvent.click(screen.getByLabelText('2 estrellas'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows correct number of active stars', () => {
    const { container } = render(<StarRating value={3} onChange={() => {}} />)
    const active = container.querySelectorAll('[class*="active"]')
    expect(active).toHaveLength(3)
  })
})
