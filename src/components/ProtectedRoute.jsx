import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ admin = false, children }) {
  const { loading, user, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-slate-300">Verifica sessione…</div>
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (admin && !isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
