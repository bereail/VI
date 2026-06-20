import { createContext, useContext, useState, useCallback, useRef } from 'react'
import styles from '../components/Toast.module.css'

const ToastContext = createContext(null)

function ToastItem({ toast, onRemove }) {
  const handleAction = () => {
    toast.action?.()
    onRemove(toast.id)
  }
  return (
    <div className={`${styles.toast} ${styles[toast.type] || ''}`}>
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button className={styles.action} onClick={handleAction}>{toast.actionLabel}</button>
      )}
      <button className={styles.close} onClick={() => onRemove(toast.id)} aria-label="Cerrar">✕</button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const toast = useCallback(({ message, type = 'info', action, actionLabel, duration = 4000 }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, action, actionLabel }])
    timers.current[id] = setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
