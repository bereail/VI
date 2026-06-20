import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ToastProvider } from './hooks/useToast.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/vi/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
