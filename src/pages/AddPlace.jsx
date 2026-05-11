import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CoordinatePicker from '../components/CoordinatePicker'
import { supabase } from '../lib/supabase'
import { createPlace, fetchHistoricalPeriods, insertPlaceImage, createHistoricalPeriod } from '../services/places'

const initialForm = {
  title: '',
  short_description: '',
  long_description: '',
  latitude: '',
  longitude: '',
  start_year: '',
  end_year: '',
  period_id: '',
  visited: false,
  image: null,
}

function AddPlace() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [periods, setPeriods] = useState([])
  const [isAddingPeriod, setIsAddingPeriod] = useState(false)
  const [newPeriod, setNewPeriod] = useState({ name: '', start_year: '', end_year: '', color: '#38bdf8' })

  async function loadPeriods() {
    const { data, error: supabaseError } = await fetchHistoricalPeriods()
    if (!supabaseError) {
      setPeriods(data ?? [])
    }
  }

  useEffect(() => {
    let mounted = true
    async function init() {
      const { data, error: supabaseError } = await fetchHistoricalPeriods()
      if (mounted && !supabaseError) {
        setPeriods(data ?? [])
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  async function handleAddPeriod(event) {
    event.preventDefault()
    if (!newPeriod.name.trim() || !newPeriod.start_year || !newPeriod.end_year) return
    
    setSaving(true)
    const { data, error: prError } = await createHistoricalPeriod({
      name: newPeriod.name.trim(),
      start_year: Number(newPeriod.start_year),
      end_year: Number(newPeriod.end_year),
      color: newPeriod.color
    })
    
    if (!prError && data) {
      await loadPeriods()
      setForm((current) => ({ ...current, period_id: data.id }))
      setIsAddingPeriod(false)
      setNewPeriod({ name: '', start_year: '', end_year: '', color: '#38bdf8' })
    } else {
      setError(prError?.message || 'Error creating period')
    }
    setSaving(false)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateCheckbox(event) {
    const { name, checked } = event.target
    setForm((current) => ({ ...current, [name]: checked }))
  }

  function updateImage(event) {
    const file = event.target.files?.[0] ?? null
    setForm((current) => ({ ...current, image: file }))
  }

  function updateCoordinates({ latitude, longitude }) {
    setForm((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    const startYear = Number(form.start_year)
    const endYear = Number(form.end_year)

    if (!form.title.trim() || !form.short_description.trim() || !form.long_description.trim()) {
      setError('Please fill in the title, short description, and long description.')
      return
    }

    if (!form.period_id) {
      setError('Please select a historical period.')
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

    const { data, error: supabaseError } = await createPlace({
      title: form.title.trim(),
      short_description: form.short_description.trim(),
      long_description: form.long_description.trim(),
      latitude,
      longitude,
      start_year: startYear,
      end_year: endYear,
      period_id: Number(form.period_id),
      visited: form.visited,
    })

    if (supabaseError) {
      setSaving(false)
      setError(supabaseError.message)
      return
    }

    if (form.image && data?.id) {
      const filePath = `places/${data.id}/${Date.now()}-${form.image.name}`
      const { error: uploadError } = await supabase.storage
        .from('place-images')
        .upload(filePath, form.image, { upsert: true })

      if (!uploadError) {
        const { data: publicData } = supabase.storage.from('place-images').getPublicUrl(filePath)
        await insertPlaceImage({
          place_id: data.id,
          image_url: publicData?.publicUrl,
          thumbnail_url: publicData?.publicUrl,
          caption: form.title.trim(),
          is_primary: true,
        })
      }
    }

    setSaving(false)
    navigate('/')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <section className="panel">
        <div className="panel-header">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Add location
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
              <span className="text-sm font-medium text-slate-200">Short description</span>
              <textarea
                className="min-h-36 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="short_description"
                required
                value={form.short_description}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Long description</span>
              <textarea
                className="min-h-40 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="long_description"
                required
                value={form.long_description}
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

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">Historical period</span>
                <button
                  type="button"
                  onClick={() => setIsAddingPeriod(!isAddingPeriod)}
                  className="text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  {isAddingPeriod ? 'Cancel' : '+ Create new period'}
                </button>
              </div>
              
              {isAddingPeriod ? (
                <div className="space-y-4 rounded-2xl border border-cyan-400/30 bg-cyan-950/20 p-4">
                  <h3 className="text-sm font-semibold text-cyan-300">New Historical Period</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-medium text-slate-300">Name</span>
                      <input
                        className="w-full rounded-xl border border-cyan-400/20 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                        value={newPeriod.name}
                        onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                        placeholder="e.g. Renaissance"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-slate-300">Start Year</span>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-cyan-400/20 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                        value={newPeriod.start_year}
                        onChange={(e) => setNewPeriod({ ...newPeriod, start_year: e.target.value })}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-slate-300">End Year</span>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-cyan-400/20 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                        value={newPeriod.end_year}
                        onChange={(e) => setNewPeriod({ ...newPeriod, end_year: e.target.value })}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPeriod}
                    disabled={saving}
                    className="rounded-xl bg-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/30"
                  >
                    Save Period
                  </button>
                </div>
              ) : (
                <select
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="period_id"
                  required
                  value={form.period_id}
                  onChange={updateField}
                >
                  <option value="">Select a period</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.start_year} → {period.end_year})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Coordinate picker</span>
              <CoordinatePicker
                value={{
                  latitude: form.latitude ? Number(form.latitude) : null,
                  longitude: form.longitude ? Number(form.longitude) : null,
                }}
                onChange={updateCoordinates}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Primary image</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                type="file"
                accept="image/*"
                onChange={updateImage}
              />
            </label>

            <label className="flex items-center gap-3 md:col-span-2">
              <input
                checked={form.visited}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-400"
                name="visited"
                type="checkbox"
                onChange={updateCheckbox}
              />
              <span className="text-sm text-slate-200">Mark as visited</span>
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

            <p className="text-sm text-slate-400">
              Uses Supabase inserts and storage uploads on the frontend only.
            </p>
          </div>
        </form>
      </section>
    </main>
  )
}

export default AddPlace
