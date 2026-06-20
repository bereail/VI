import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import CineMain from './CineMain'
import './styles/global.css'

export default function App() {
  const { user, login, register, resetPassword, logout } = useAuth()

  if (!user) {
    return (
      <LoginPage
        onLogin={login}
        onRegister={register}
        onReset={resetPassword}
      />
    )
  }

  return <CineMain user={user} onLogout={logout} />
}
