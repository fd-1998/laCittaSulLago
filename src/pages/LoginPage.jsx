import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SiteLogo from '../assets/logo.png'

export default function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-82px)] max-w-lg items-center px-4 py-12">
      <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <img src={SiteLogo} alt="" className="mx-auto h-24 w-24 rounded-full" />
        <h1 className="mt-6 text-center text-2xl font-semibold text-white">Accesso collaboratori</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          L’accesso è riservato a chi modifica i contenuti dell’atlante.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Nome utente</span>
            <input
              autoComplete="username"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">{error}</p> : null}
          <button
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Accesso…' : 'Accedi'}
          </button>
        </form>
      </section>
    </main>
  )
}
