import { useState } from 'react'
import styles from './StarRating.module.css'

export function StarRating({ value = 0, onChange, size = 'md', readOnly = false }) {
  const [hover, setHover] = useState(0)

  const display = hover || value

  return (
    <div
      className={`${styles.stars} ${styles[size]} ${readOnly ? styles.readOnly : ''}`}
      role="group"
      aria-label={`Puntuación: ${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.star} ${display >= n ? styles.active : ''}`}
          onClick={() => !readOnly && onChange?.(n === value ? 0 : n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          disabled={readOnly}
        >
          ★
        </button>
      ))}
    </div>
  )
}
