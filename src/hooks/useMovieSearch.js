import { useState, useRef, useCallback } from 'react'

const BASE = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p'

const DEFAULT_API_KEY = 'f14d67712e440235df03189a794d9aab'

function getBearer() {
  return import.meta.env.VITE_TMDB_BEARER_TOKEN || localStorage.getItem('vi_tmdb_bearer') || ''
}

function getApiKey() {
  return import.meta.env.VITE_TMDB_API_KEY || localStorage.getItem('vi_tmdb_key') || DEFAULT_API_KEY
}

export function hasApiKey() {
  return Boolean(getBearer() || getApiKey())
}

export function posterUrl(path, size = 'w500') {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

async function tmdbFetch(path, params = {}) {
  const apiKey = getApiKey()
  const bearer = getBearer()
  if (!apiKey && !bearer) throw new Error('NO_KEY')

  const { _signal, ...rest } = params
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('language', 'es-MX')
  // Use api_key as query param (simple GET, no CORS preflight)
  // Bearer as header only if no api_key (header triggers CORS preflight)
  if (apiKey) {
    url.searchParams.set('api_key', apiKey)
  } else {
    // no api_key, must use bearer — caller must accept CORS may block
  }
  Object.entries(rest).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  const options = {}
  if (_signal) options.signal = _signal
  if (!apiKey && bearer) options.headers = { 'Authorization': `Bearer ${bearer}` }

  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`TMDB_${res.status}`)
  const data = await res.json()
  // TMDB sometimes returns HTTP 200 with success:false on backend issues
  if (data.success === false) throw new Error(`TMDB_BACKEND_${data.status_code}`)
  return data
}

// Genres: fire-and-forget background load — never blocks search
let genreCache = null

function loadGenresBackground() {
  if (genreCache !== null) return          // already loaded or already failed
  genreCache = {}                          // mark as "loading" so we don't fire twice
  tmdbFetch('/genre/movie/list')
    .then((data) => {
      genreCache = {}
      ;(data.genres || []).forEach((g) => { genreCache[g.id] = g.name })
    })
    .catch(() => {
      genreCache = {}                      // fail silently, search still works
    })
}

function mapSearchResult(r) {
  const genres = (r.genre_ids || []).map((id) => genreCache?.[id]).filter(Boolean)
  return {
    tmdbId: r.id,
    title: r.title || r.original_title,
    year: r.release_date ? parseInt(r.release_date) : null,
    poster: r.poster_path ? posterUrl(r.poster_path) : null,
    overview: r.overview || '',
    genres,
    director: null,
  }
}

function mapDetails(r) {
  const director = (r.credits?.crew || []).find((c) => c.job === 'Director')?.name || null
  return {
    tmdbId: r.id,
    title: r.title || r.original_title,
    year: r.release_date ? parseInt(r.release_date) : null,
    poster: r.poster_path ? posterUrl(r.poster_path) : null,
    overview: r.overview || '',
    genres: (r.genres || []).map((g) => g.name),
    director,
  }
}

export function useMovieSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const timerRef = useRef(null)

  const search = useCallback((query) => {
    clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    // Kick off genre load in background (won't block search)
    loadGenresBackground()

    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(async () => {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const data = await tmdbFetch('/search/movie', {
          query: query.trim(),
          include_adult: 'false',
          _signal: ctrl.signal,
        })
        setResults((data.results || []).slice(0, 10).map(mapSearchResult))
      } catch (err) {
        if (err.name === 'AbortError') return
        if (err.message === 'NO_KEY') {
          setError('Configurá tu API key de TMDB en ajustes.')
        } else if (err.message === 'TMDB_401' || err.message === 'TMDB_403') {
          setError('Token inválido. Verificá tu clave en ⚙️.')
        } else if (err.message?.startsWith('TMDB_5') || err.message?.startsWith('TMDB_BACKEND')) {
          setError('TMDB no disponible en este momento. Intentá de nuevo en unos segundos.')
        } else {
          setError('Error al buscar. Revisá tu conexión.')
        }
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  const getDetails = useCallback(async (tmdbId) => {
    const data = await tmdbFetch(`/movie/${tmdbId}`, { append_to_response: 'credits' })
    return mapDetails(data)
  }, [])

  const clear = useCallback(() => {
    clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()
    setResults([])
    setLoading(false)
    setError(null)
  }, [])

  return { results, loading, error, search, getDetails, clear }
}

export function saveApiKey(key) {
  const trimmed = key.trim()
  if (trimmed.startsWith('ey')) {
    localStorage.setItem('vi_tmdb_bearer', trimmed)
  } else {
    localStorage.setItem('vi_tmdb_key', trimmed)
  }
  genreCache = null
}

export function removeApiKey() {
  localStorage.removeItem('vi_tmdb_bearer')
  localStorage.removeItem('vi_tmdb_key')
  genreCache = null
}
