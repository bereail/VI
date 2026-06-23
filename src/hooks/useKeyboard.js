import { useEffect, useRef } from 'react'

export function useKeyboard(handlers) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const handle = (e) => {
      const tag = e.target.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable
      if (e.key === 'Escape') {
        ref.current.escape?.()
        return
      }
      if (typing) return
      ref.current[e.key]?.()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
}
