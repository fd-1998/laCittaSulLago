import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', password: '', role: 'collaborator' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await apiRequest('/admin/users'))
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [])

  useEffect(() => {
    // Loading is intentionally tied to the route lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [loadUsers])

  async function createUser(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiRequest('/admin/users', { method: 'POST', body: form })
      setForm({ username: '', password: '', role: 'collaborator' })
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateUser(id, changes) {
    setError('')
    try {
      await apiRequest(`/admin/users/${id}`, { method: 'PATCH', body: changes })
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold text-white">Collaboratori</h1>
      <p className="mt-2 text-slate-400">Crea account e gestisci i permessi editoriali.</p>

      <form className="mt-8 grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:grid-cols-4" onSubmit={createUser}>
        <input
          aria-label="Nome utente"
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3"
          placeholder="Nome utente"
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          required
        />
        <input
          aria-label="Password temporanea"
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3"
          minLength={14}
          placeholder="Password (min. 14)"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
        />
        <select
          aria-label="Ruolo"
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3"
          value={form.role}
          onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
        >
          <option value="collaborator">Collaboratore</option>
          <option value="admin">Admin</option>
        </select>
        <button className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60" disabled={saving}>
          {saving ? 'Creazione…' : 'Crea utente'}
        </button>
      </form>

      {error ? <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200" role="alert">{error}</p> : null}

      <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr><th className="p-4">Utente</th><th className="p-4">Ruolo</th><th className="p-4">Stato</th><th className="p-4">Azioni</th></tr>
          </thead>
          <tbody>
            {users.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-800">
                <td className="p-4 font-medium text-white">{entry.username}</td>
                <td className="p-4">{entry.role}</td>
                <td className="p-4">{entry.is_active ? 'Attivo' : 'Disattivato'}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-slate-700 px-3 py-1" onClick={() => updateUser(entry.id, { role: entry.role === 'admin' ? 'collaborator' : 'admin' })}>
                      Rendi {entry.role === 'admin' ? 'collaboratore' : 'admin'}
                    </button>
                    <button className="rounded-full border border-slate-700 px-3 py-1" onClick={() => updateUser(entry.id, { is_active: !entry.is_active })}>
                      {entry.is_active ? 'Disattiva' : 'Riattiva'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
