import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AdminPage } from './pages/AdminPage'
import CineMain from './CineMain'
import './styles/global.css'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

export default function App() {
  const { user, login, register, forgotPassword, resetPassword, guestLogin, logout } = useAuth()
  const [adminOpen, setAdminOpen] = useState(false)
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset_token'))

  const handleResetDone = () => {
    window.history.replaceState({}, '', window.location.pathname)
    window.location.reload()
  }

  if (resetToken) {
    return <ResetPasswordPage token={resetToken} onReset={resetPassword} onDone={handleResetDone} />
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={login}
        onRegister={register}
        onForgotPassword={forgotPassword}
        onGuestLogin={guestLogin}
      />
    )
  }

  if (adminOpen && user.email === ADMIN_EMAIL) {
    return <AdminPage onBack={() => setAdminOpen(false)} />
  }

  return (
    <CineMain
      user={user}
      onLogout={logout}
      onOpenAdmin={user.email === ADMIN_EMAIL ? () => setAdminOpen(true) : undefined}
    />
  )
}
