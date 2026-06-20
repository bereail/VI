import { useEffect } from 'react'

export function useKeyboard(handlers) {
  useEffect(() => {
    const handle = (e) => {
      const tag = e.target.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable
      if (e.key === 'Escape') {
        handlers.escape?.()
        return
      }
      if (typing) return
      handlers[e.key]?.()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [handlers])
}
