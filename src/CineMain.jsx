import { useState, useCallback, useEffect, useRef } from 'react'
import { LibraryPage } from './pages/LibraryPage'
import { MovieModal } from './components/MovieModal'
import { SearchModal } from './components/SearchModal'
import { StatsModal } from './components/StatsModal'
import { ApiKeyModal } from './components/ApiKeyModal'
import { useMovies, checkBackupReminder } from './hooks/useMovies'
import { useTheme } from './hooks/useTheme'
import { useKeyboard } from './hooks/useKeyboard'
import { useToast } from './hooks/useToast'
import { hasApiKey } from './hooks/useMovieSearch'
import { exportLibraryPdf } from './exportCard'

export default function CineMain({ user, onLogout, onOpenAdmin }) {
  const { movies, addMovie, updateMovie, deleteMovie, restoreMovie, togglePriority, markWatched, markPending, exportData, importData, stats, uniqueGenres, uniqueDirectors } = useMovies(user.email)
  const { theme, toggle: toggleTheme } = useTheme()
  const toast = useToast()

  const [modal, setModal] = useState(null)
  const backupReminderShown = useRef(false)

  const close = useCallback(() => setModal(null), [])
  const openAdd = useCallback(() => setModal({ type: 'add' }), [])
  const openEdit = useCallback((movie) => setModal({ type: 'edit', data: movie }), [])
  const openStats = useCallback(() => setModal({ type: 'stats' }), [])
  const openApiKey = useCallback(() => setModal({ type: 'apikey' }), [])

  const openSearch = useCallback(() => {
    setModal(hasApiKey() ? { type: 'search' } : { type: 'apikey', next: 'search' })
  }, [])

  useEffect(() => {
    if (backupReminderShown.current || movies.length === 0) return
    backupReminderShown.current = true
    if (checkBackupReminder()) {
      toast({
        message: 'Hacé un backup de tu filmoteka',
        actionLabel: 'Exportar',
        action: exportData,
        duration: 8000,
      })
    }
  }, [movies.length, exportData, toast])

  const handleSave = useCallback(async (formData) => {
    try {
      if (formData.id) await updateMovie(formData.id, formData)
      else await addMovie(formData)
      close()
    } catch (e) {
      toast({ message: 'Error al guardar: ' + e.message, type: 'error' })
    }
  }, [addMovie, updateMovie, close, toast])

  const handleRate = useCallback((id, rating) => {
    updateMovie(id, { rating })
  }, [updateMovie])

  const handleDelete = useCallback(async (id) => {
    const movie = movies.find(m => m.id === id)
    await deleteMovie(id)
    toast({
      message: `"${movie?.title}" eliminada`,
      actionLabel: 'Deshacer',
      action: () => restoreMovie(movie),
      duration: 5000,
    })
  }, [movies, deleteMovie, restoreMovie, toast])

  const handleTmdbSelect = useCallback((tmdbMovie) => {
    setModal({ type: 'add', data: tmdbMovie })
  }, [])

  const handleApiKeyClose = useCallback((saved) => {
    if (saved && modal?.next === 'search') setModal({ type: 'search' })
    else close()
  }, [modal, close])

  const handleImport = useCallback(async (file) => {
    try {
      const { imported, skipped } = await importData(file)
      const msg = skipped > 0
        ? `${imported} película${imported !== 1 ? 's' : ''} importada${imported !== 1 ? 's' : ''}, ${skipped} ya existían`
        : `${imported} película${imported !== 1 ? 's' : ''} importada${imported !== 1 ? 's' : ''}`
      toast({ message: msg, type: 'success' })
    } catch (e) {
      toast({ message: 'Error al importar: ' + e.message, type: 'error' })
    }
  }, [importData, toast])

  const handleExportPdf = useCallback(async () => {
    if (movies.length === 0) return
    toast({ message: 'Generando PDF...', duration: 3000 })
    try {
      await exportLibraryPdf(movies)
    } catch (e) {
      toast({ message: 'Error al generar el PDF: ' + e.message, type: 'error' })
    }
  }, [movies, toast])

  useKeyboard({
    n: openAdd,
    b: openSearch,
    s: openStats,
    '/': () => document.querySelector('[data-shortcut="filter"]')?.focus(),
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
        onAddFromDiscover={handleTmdbSelect}
        onStats={openStats}
        onExport={handleExportPdf}
        onBackup={exportData}
        onImport={handleImport}
        onToggleTheme={toggleTheme}
        theme={theme}
        onApiKey={openApiKey}
        onLogout={onLogout}
        onTogglePriority={togglePriority}
        onOpenAdmin={onOpenAdmin}
      />

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <MovieModal
          movie={modal.data || null}
          onSave={handleSave}
          onClose={close}
        />
      )}

      {modal?.type === 'search' && (
        <SearchModal onSelect={handleTmdbSelect} onClose={close} />
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
