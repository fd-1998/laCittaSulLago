import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const initialForm = {
  title: '',
  description: '',
  latitude: '',
  longitude: '',
  start_year: '',
  end_year: '',
  period_label: '',
}

function AddPlace() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    const startYear = Number(form.start_year)
    const endYear = Number(form.end_year)

    if (!form.title.trim() || !form.description.trim() || !form.period_label.trim()) {
      setError('Please fill in the title, description, and period label.')
      return
    }

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      Number.isNaN(startYear) ||
      Number.isNaN(endYear)
    ) {
      setError('Latitude, longitude, start year, and end year must be valid numbers.')
      return
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Latitude must be between -90 and 90, and longitude between -180 and 180.')
      return
    }

    if (startYear > endYear) {
      setError('Start year must be less than or equal to end year.')
      return
    }

    setSaving(true)

    const { error: supabaseError } = await supabase.from('places').insert([
      {
        title: form.title.trim(),
        description: form.description.trim(),
        latitude,
        longitude,
        start_year: startYear,
        end_year: endYear,
        period_label: form.period_label.trim(),
      },
    ])

    setSaving(false)

    if (supabaseError) {
      setError(supabaseError.message)
      return
    }

    navigate('/')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <section className="panel">
        <div className="panel-header">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Admin form
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Add a place</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Save a new historical location to the <code className="rounded bg-slate-800 px-2 py-0.5">places</code> table.
          </p>
        </div>

        <form className="panel-body space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Title</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="title"
                required
                value={form.title}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Description</span>
              <textarea
                className="min-h-36 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="description"
                required
                value={form.description}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Latitude</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="latitude"
                step="any"
                type="number"
                required
                value={form.latitude}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Longitude</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="longitude"
                step="any"
                type="number"
                required
                value={form.longitude}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Start year</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="start_year"
                type="number"
                required
                value={form.start_year}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">End year</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="end_year"
                type="number"
                required
                value={form.end_year}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Period label</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="period_label"
                required
                value={form.period_label}
                onChange={updateField}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Saving…' : 'Save place'}
            </button>

            <p className="text-sm text-slate-400">Uses Supabase insert on the frontend only.</p>
          </div>
        </form>
      </section>
    </main>
  )
}

export default AddPlace
