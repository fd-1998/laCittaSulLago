import { useState } from 'react'
import { apiRequest } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function AccountPage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (newPassword !== confirmation) {
      setError('Le nuove password non coincidono.')
      return
    }
    setSaving(true)
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmation('')
      setMessage('Password aggiornata. Le altre sessioni sono state revocate.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-white">Account</h1>
      <p className="mt-2 text-slate-400">
        {user.username} · {user.role === 'admin' ? 'Amministratore' : 'Collaboratore'}
      </p>
      <form className="mt-8 space-y-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">Password corrente</span>
          <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">Nuova password</span>
          <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" type="password" autoComplete="new-password" minLength={14} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">Conferma nuova password</span>
          <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" type="password" autoComplete="new-password" minLength={14} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
        </label>
        {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">{error}</p> : null}
        {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200" role="status">{message}</p> : null}
        <button className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60" disabled={saving}>
          {saving ? 'Aggiornamento…' : 'Aggiorna password'}
        </button>
      </form>
    </main>
  )
}
