import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { AdminPage } from './pages/AdminPage'
import CineMain from './CineMain'
import './styles/global.css'

const ADMIN_EMAIL = 'berenicesolohaga@gmail.com'

export default function App() {
  const { user, login, register, resetPassword, logout } = useAuth()
  const [adminOpen, setAdminOpen] = useState(false)

  if (!user) {
    return (
      <LoginPage
        onLogin={login}
        onRegister={register}
        onReset={resetPassword}
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
