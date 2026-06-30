import { useState, useEffect } from 'react'
import { StarRating } from './StarRating'
import { Icon } from './Icon'
import styles from './MovieModal.module.css'

const GENRE_OPTIONS = [
  'Acción', 'Animación', 'Aventura', 'Bélica', 'Ciencia ficción',
  'Comedia', 'Crimen', 'Documental', 'Drama', 'Fantasía',
  'Historia', 'Horror', 'Misterio', 'Música', 'Romance',
  'Suspenso', 'Terror', 'Thriller', 'Western',
]

const COVER_COLORS = [
  '#1a2a4a', '#2a1a3a', '#1a3a2a', '#3a2a1a', '#2a3a3a',
  '#3a1a1a', '#1a3a3a', '#3a2a3a', '#2a1a1a', '#1a2a3a',
  '#3a3a1a', '#2a3a1a', '#4a1a1a', '#1a4a2a', '#1a1a4a',
]

const EMPTY = {
  title: '', year: '', director: '', genres: [],
  poster: '', overview: '', status: 'pendiente',
  rating: 0, watchedDate: '', notes: '', coverColor: COVER_COLORS[0],
}

export function MovieModal({ movie, onSave, onClose }) {
  const isEdit = Boolean(movie?.id)
  const [form, setForm] = useState(() =>
    movie
      ? { ...EMPTY, ...movie, genres: movie.genres || [], year: movie.year || '', coverColor: movie.coverColor || COVER_COLORS[0] }
      : EMPTY
  )
  const [errors, setErrors] = useState({})
  const [genreInput, setGenreInput] = useState('')

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  const toggleGenre = (g) => {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }))
  }

  const addCustomGenre = (e) => {
    if (e.key === 'Enter' && genreInput.trim()) {
      e.preventDefault()
      const g = genreInput.trim()
      if (!form.genres.includes(g)) toggleGenre(g)
      setGenreInput('')
    }
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'El título es requerido'
    if (form.status === 'vista' && !form.watchedDate) e.watchedDate = 'Ingresá la fecha en que la viste'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      ...form,
      year: form.year ? parseInt(form.year) : null,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <form onSubmit={handleSubmit}>
          <div className={styles.header}>
            <h2 className={styles.title}>{isEdit ? 'Editar película' : 'Agregar película'}</h2>
            <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className={styles.body}>
            {/* Poster preview */}
            <div className={styles.posterPreview}>
              {form.poster ? (
                <img src={form.poster} alt="Tapa" />
              ) : (
                <div className={styles.colorPreview} style={{ background: form.coverColor }}>
                  <span>{form.title ? form.title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'}</span>
                </div>
              )}
            </div>

            <div className={styles.grid}>
              <div className={`${styles.field} ${styles.span2}`}>
                <label>Título <span className={styles.req}>*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Nombre de la película"
                  className={errors.title ? styles.inputError : ''}
                />
                {errors.title && <span className={styles.error}>{errors.title}</span>}
              </div>

              <div className={styles.field}>
                <label>Director/a</label>
                <input
                  value={form.director}
                  onChange={(e) => set('director', e.target.value)}
                  placeholder="Nombre del director"
                />
              </div>

              <div className={styles.field}>
                <label>Año</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => set('year', e.target.value)}
                  placeholder="2024"
                  min="1888"
                  max={new Date().getFullYear() + 2}
                />
              </div>

              <div className={`${styles.field} ${styles.span2}`}>
                <label>Sinopsis</label>
                <textarea
                  value={form.overview}
                  onChange={(e) => set('overview', e.target.value)}
                  placeholder="De qué trata..."
                  rows={3}
                />
              </div>

              <div className={`${styles.field} ${styles.span2}`}>
                <label>Géneros</label>
                <div className={styles.genreGrid}>
                  {GENRE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`${styles.genreChip} ${form.genres.includes(g) ? styles.genreActive : ''}`}
                      onClick={() => toggleGenre(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <input
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyDown={addCustomGenre}
                  placeholder="Otro género (Enter para agregar)"
                  style={{ marginTop: 8 }}
                />
                {form.genres.length > 0 && (
                  <div className={styles.selectedGenres}>
                    {form.genres.map((g) => (
                      <button key={g} type="button" className={styles.genreTag} onClick={() => toggleGenre(g)}>
                        {g} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!form.poster && (
                <div className={`${styles.field} ${styles.span2}`}>
                  <label>Color de tapa</label>
                  <div className={styles.colorGrid}>
                    {COVER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.colorChip} ${form.coverColor === c ? styles.colorActive : ''}`}
                        style={{ background: c }}
                        onClick={() => set('coverColor', c)}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.coverColor}
                      onChange={(e) => set('coverColor', e.target.value)}
                      className={styles.colorPicker}
                      title="Color personalizado"
                    />
                  </div>
                </div>
              )}

              <div className={`${styles.field} ${styles.span2}`}>
                <label>Estado</label>
                <div className={styles.statusBtns}>
                  {['pendiente', 'vista'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.statusBtn} ${form.status === s ? styles.statusActive : ''}`}
                      onClick={() => set('status', s)}
                    >
                      {s === 'vista' ? '✓ Vista' : '◷ Pendiente'}
                    </button>
                  ))}
                </div>
              </div>

              {form.status === 'vista' && (
                <>
                  <div className={styles.field}>
                    <label>Fecha en que la vi <span className={styles.req}>*</span></label>
                    <input
                      type="date"
                      value={form.watchedDate}
                      onChange={(e) => set('watchedDate', e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className={errors.watchedDate ? styles.inputError : ''}
                    />
                    {errors.watchedDate && <span className={styles.error}>{errors.watchedDate}</span>}
                  </div>

                  <div className={styles.field}>
                    <label>Mi puntuación</label>
                    <StarRating value={form.rating} onChange={(v) => set('rating', v)} size="lg" />
                  </div>
                </>
              )}

              <div className={`${styles.field} ${styles.span2}`}>
                <label>Anotaciones</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Lo que más me gustó, lo que no, con quién la vi..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Guardar cambios' : 'Agregar película'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
