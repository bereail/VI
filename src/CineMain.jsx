import { useState, useCallback } from 'react'
import { LibraryPage } from './pages/LibraryPage'
import { MovieModal } from './components/MovieModal'
import { SearchModal } from './components/SearchModal'
import { StatsModal } from './components/StatsModal'
import { ApiKeyModal } from './components/ApiKeyModal'
import { useMovies } from './hooks/useMovies'
import { useTheme } from './hooks/useTheme'
import { useKeyboard } from './hooks/useKeyboard'
import { hasApiKey } from './hooks/useMovieSearch'

export default function CineMain({ user, onLogout }) {
  const { movies, addMovie, updateMovie, deleteMovie, markWatched, markPending, exportData, importData, stats, uniqueGenres, uniqueDirectors } = useMovies(user.email)
  const { theme, toggle: toggleTheme } = useTheme()

  const [modal, setModal] = useState(null)

  const close = useCallback(() => setModal(null), [])
  const openAdd = useCallback(() => setModal({ type: 'add' }), [])
  const openEdit = useCallback((movie) => setModal({ type: 'edit', data: movie }), [])
  const openStats = useCallback(() => setModal({ type: 'stats' }), [])
  const openApiKey = useCallback(() => setModal({ type: 'apikey' }), [])

  const openSearch = useCallback(() => {
    setModal(hasApiKey() ? { type: 'search' } : { type: 'apikey', next: 'search' })
  }, [])

  const handleSave = useCallback((formData) => {
    if (formData.id) updateMovie(formData.id, formData)
    else addMovie(formData)
    close()
  }, [addMovie, updateMovie, close])

  const handleRate = useCallback((id, rating) => {
    updateMovie(id, { rating })
  }, [updateMovie])

  const handleDelete = useCallback((id) => {
    if (window.confirm('¿Eliminar esta película de tu filmoteka?')) deleteMovie(id)
  }, [deleteMovie])

  const handleSearchSelect = useCallback((tmdbMovie) => {
    setModal({ type: 'add', data: tmdbMovie })
  }, [])

  const handleApiKeyClose = useCallback((saved) => {
    if (saved && modal?.next === 'search') setModal({ type: 'search' })
    else close()
  }, [modal, close])

  const handleImport = useCallback(async (file) => {
    try {
      const count = await importData(file)
      alert(`Se importaron ${count} películas.`)
    } catch (e) {
      alert('Error al importar: ' + e.message)
    }
  }, [importData])

  useKeyboard({
    n: openAdd,
    b: openSearch,
    s: openStats,
    '/': () => document.querySelector('input[aria-label="Buscar películas"]')?.focus(),
    escape: close,
  })

  return (
    <>
      <LibraryPage
        movies={movies}
        uniqueGenres={uniqueGenres}
        uniqueDirectors={uniqueDirectors}
        stats={stats}
        user={user}
        onEdit={openEdit}
        onDelete={handleDelete}
        onMarkWatched={markWatched}
        onMarkPending={markPending}
        onRate={handleRate}
        onAdd={openAdd}
        onSearchTmdb={openSearch}
        onStats={openStats}
        onExport={exportData}
        onImport={handleImport}
        onToggleTheme={toggleTheme}
        theme={theme}
        onApiKey={openApiKey}
        onLogout={onLogout}
      />

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <MovieModal
          movie={modal.data || null}
          onSave={handleSave}
          onClose={close}
        />
      )}

      {modal?.type === 'search' && (
        <SearchModal onSelect={handleSearchSelect} onClose={close} />
      )}

      {modal?.type === 'stats' && (
        <StatsModal stats={stats} onClose={close} />
      )}

      {modal?.type === 'apikey' && (
        <ApiKeyModal onClose={handleApiKeyClose} />
      )}
    </>
  )
}
