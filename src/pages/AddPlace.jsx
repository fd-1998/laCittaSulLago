import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CoordinatePicker from '../components/CoordinatePicker'
import ImageUploader from '../components/ImageUploader'
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
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

function resolvePeriodId(value) {
  if (value == null || value === '') {
    return null
  }

  const numericValue = Number(value)
  if (!Number.isNaN(numericValue)) {
    return numericValue
  }

  return value
}

function createPreviewItem(file, isPrimary = false) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    isPrimary,
  }
}

function AddPlace() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [images, setImages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingPeriod, setIsSavingPeriod] = useState(false)
  const [error, setError] = useState('')
  const [periods, setPeriods] = useState([])
  const [isAddingPeriod, setIsAddingPeriod] = useState(false)
  const [newPeriod, setNewPeriod] = useState({ name: '', start_year: '', end_year: '', color: '#38bdf8' })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const imagesRef = useRef([])
  const searchAbortRef = useRef(null)

  const primaryImage = useMemo(
    () => images.find((image) => image.isPrimary) ?? images[0] ?? null,
    [images]
  )

  const loadPeriods = useCallback(async () => {
    const { data, error: supabaseError } = await fetchHistoricalPeriods()
    if (!supabaseError) {
      setPeriods(data ?? [])
    }
  }, [])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort()
    }
  }, [])

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
    
    setIsSavingPeriod(true)
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
      setError(prError?.message || 'Errore durante la creazione del periodo')
    }
    setIsSavingPeriod(false)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateCheckbox(event) {
    const { name, checked } = event.target
    setForm((current) => ({ ...current, [name]: checked }))
  }

  function validateAndAddFiles(fileList) {
    const incoming = Array.from(fileList ?? [])
    if (!incoming.length) {
      return
    }

    const accepted = []
    const rejected = []

    for (const file of incoming) {
      if (!file.type.startsWith('image/')) {
        rejected.push(`${file.name} non è un'immagine`)
        continue
      }

      if (file.size > MAX_IMAGE_SIZE) {
        rejected.push(`${file.name} è più grande di 10 MB`)
        continue
      }

      accepted.push(file)
    }

    if (rejected.length) {
      setError(rejected.join(' · '))
    } else {
      setError('')
    }

    if (!accepted.length) {
      return
    }

    setImages((current) => {
      const nextItems = accepted.map((file, index) => createPreviewItem(file, current.length === 0 && index === 0))

      if (!current.some((image) => image.isPrimary) && nextItems.length) {
        nextItems[0] = { ...nextItems[0], isPrimary: true }
      }

      return [...current, ...nextItems]
    })
  }

  function removeImage(imageId) {
    setImages((current) => {
      const removed = current.find((image) => image.id === imageId)
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      const next = current.filter((image) => image.id !== imageId)
      if (!next.length) {
        return []
      }

      if (!next.some((image) => image.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true }
      }

      return next
    })
  }

  function markPrimaryImage(imageId) {
    setImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })))
  }

  const updateCoordinates = useCallback(({ latitude, longitude }) => {
    setForm((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }))
  }, [])

  async function handleSearch(event) {
    event?.preventDefault()
    const query = searchQuery.trim()
    if (!query) {
      setSearchError('Inserisci un luogo da cercare.')
      setSearchResults([])
      return
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
    }

    const controller = new AbortController()
    searchAbortRef.current = controller
    setIsSearching(true)
    setSearchError('')

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '6',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'it',
        },
      })

      if (!response.ok) {
        throw new Error('Risposta non valida da OpenStreetMap.')
      }

      const results = await response.json()
      if (!Array.isArray(results) || results.length === 0) {
        setSearchResults([])
        setSearchError('Nessun risultato trovato.')
        return
      }

      setSearchResults(results)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setSearchError('Errore durante la ricerca. Riprova più tardi.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch(event)
    }
  }

  function handleSelectSearchResult(result) {
    const latitude = Number(result?.lat)
    const longitude = Number(result?.lon)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setSearchError('Coordinate non valide dal risultato selezionato.')
      return
    }

    updateCoordinates({ latitude, longitude })
    setSearchQuery(result?.display_name ?? searchQuery)
    setSearchResults([])
    setSearchError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    const startYear = Number(form.start_year)
    const endYear = Number(form.end_year)
    const resolvedPeriodId = resolvePeriodId(form.period_id)

    if (!form.title.trim() || !form.short_description.trim() || !form.long_description.trim()) {
      setError('Compila il titolo, la descrizione breve e la descrizione estesa.')
      return
    }

    if (!form.period_id) {
      setError('Seleziona un periodo storico.')
      return
    }

    if (resolvedPeriodId == null) {
      setError('Il periodo selezionato non è valido.')
      return
    }

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      Number.isNaN(startYear) ||
      Number.isNaN(endYear)
    ) {
      setError('Latitudine, longitudine, anno inizio e anno fine devono essere numeri validi.')
      return
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('La latitudine deve essere tra -90 e 90 e la longitudine tra -180 e 180.')
      return
    }

    if (startYear > endYear) {
      setError("L'anno di inizio deve essere minore o uguale all'anno di fine.")
      return
    }

    if (images.some((image) => image.file.size > MAX_IMAGE_SIZE)) {
      setError('Una o più immagini sono troppo grandi. Ogni file deve essere massimo 10 MB.')
      return
    }

    setIsSubmitting(true)

    const { data, error: supabaseError } = await createPlace({
      title: form.title.trim(),
      short_description: form.short_description.trim(),
      long_description: form.long_description.trim(),
      latitude,
      longitude,
      start_year: startYear,
      end_year: endYear,
      period_id: resolvedPeriodId,
      visited: form.visited,
    })

    if (supabaseError) {
      setIsSubmitting(false)
      setError(supabaseError.message)
      return
    }

    if (data?.id && images.length) {
      const uploadResults = await Promise.all(
        images.map(async (image, index) => {
          const safeFileName = image.file.name.replace(/[^a-z0-9._-]/gi, '_')
          const filePath = `public/${data.id}/${Date.now()}-${index}-${safeFileName}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('places')
            .upload(filePath, image.file, {
              upsert: false,
              cacheControl: '3600',
              contentType: image.file.type,
            })

          if (uploadError) {
            return { status: 'rejected', error: uploadError }
          }

          const publicPath = uploadData?.path ?? filePath
          const { data: publicData } = supabase.storage.from('places').getPublicUrl(publicPath)
          if (!publicData?.publicUrl) {
            return { status: 'rejected', error: new Error('URL pubblico non disponibile') }
          }

          return {
            status: 'fulfilled',
            payload: {
              place_id: data.id,
              image_url: publicData?.publicUrl,
              thumbnail_url: publicData?.publicUrl,
              caption: image.file.name,
              is_primary: image.isPrimary,
            },
          }
        })
      )

      const successfulImages = uploadResults.filter((result) => result.status === 'fulfilled' && result.payload)
      const failedUploads = uploadResults.filter((result) => result.status === 'rejected')

      if (successfulImages.length) {
        const { error: insertError } = await insertPlaceImage(successfulImages.map((result) => result.payload))
        if (insertError) {
          setIsSubmitting(false)
          setError('Luogo salvato, ma non è stato possibile collegare le immagini al luogo.')
          return
        }
      }

      if (failedUploads.length) {
        setIsSubmitting(false)
        setError(`Luogo salvato, ma ${failedUploads.length} caricamento${failedUploads.length > 1 ? 'i' : ''} immagine non è riuscito.`)
        return
      }
    }

    setIsSubmitting(false)
    navigate('/')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <section className="panel">
        <div className="panel-header">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Aggiungi luogo
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Aggiungi un luogo</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Salva un nuovo luogo storico nella tabella <code className="rounded bg-slate-800 px-2 py-0.5">places</code>.
              </p>
        </div>

        <form className="panel-body space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Titolo</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="title"
                required
                value={form.title}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Descrizione breve</span>
              <textarea
                className="min-h-36 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="short_description"
                required
                value={form.short_description}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Descrizione estesa</span>
              <textarea
                className="min-h-40 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="long_description"
                required
                value={form.long_description}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Cerca luogo (OpenStreetMap)</span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Es. Castello di Vezio, Bellagio, Lago di Como"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSearching ? 'Ricerca…' : 'Cerca'}
                </button>
              </div>
              {searchError ? (
                <p className="text-xs text-rose-300">{searchError}</p>
              ) : null}
              {searchResults.length ? (
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  {searchResults.map((result) => {
                    const latValue = Number(result.lat)
                    const lonValue = Number(result.lon)
                    const latLabel = Number.isFinite(latValue) ? latValue.toFixed(6) : '—'
                    const lonLabel = Number.isFinite(lonValue) ? lonValue.toFixed(6) : '—'

                    return (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="flex w-full flex-col gap-1 rounded-xl border border-transparent px-3 py-2 text-left text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-slate-900/70"
                      >
                        <span className="font-semibold">{result.display_name}</span>
                        <span className="text-xs text-slate-400">
                          {latLabel}, {lonLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Latitudine</span>
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
              <span className="text-sm font-medium text-slate-200">Longitudine</span>
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
              <span className="text-sm font-medium text-slate-200">Anno inizio</span>
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
              <span className="text-sm font-medium text-slate-200">Anno fine</span>
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
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-200">Periodo storico</span>
                <button
                  type="button"
                  onClick={() => setIsAddingPeriod(!isAddingPeriod)}
                  className="text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  {isAddingPeriod ? 'Annulla' : '+ Crea nuovo periodo'}
                </button>
              </div>
              
              {isAddingPeriod ? (
                <div className="space-y-4 rounded-2xl border border-cyan-400/30 bg-cyan-950/20 p-4">
                  <h3 className="text-sm font-semibold text-cyan-300">Nuovo periodo storico</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-medium text-slate-300">Nome</span>
                      <input
                        className="w-full rounded-xl border border-cyan-400/20 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                        value={newPeriod.name}
                        onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                        placeholder="es. Rinascimento"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-slate-300">Anno inizio</span>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-cyan-400/20 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                        value={newPeriod.start_year}
                        onChange={(e) => setNewPeriod({ ...newPeriod, start_year: e.target.value })}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-slate-300">Anno fine</span>
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
                    disabled={isSavingPeriod}
                    className="rounded-xl bg-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/30"
                  >
                    {isSavingPeriod ? 'Salvataggio…' : 'Salva periodo'}
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
                  <option value="">Seleziona un periodo</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.start_year} → {period.end_year})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Selettore coordinate</span>
              <CoordinatePicker
                value={{
                  latitude: form.latitude ? Number(form.latitude) : null,
                  longitude: form.longitude ? Number(form.longitude) : null,
                }}
                onChange={updateCoordinates}
              />
            </label>

            <div className="md:col-span-2">
              <ImageUploader
                disabled={isSubmitting}
                images={images}
                onAddFiles={validateAndAddFiles}
                onMarkPrimary={markPrimaryImage}
                onRemoveImage={removeImage}
              />
              {primaryImage ? (
                <p className="mt-3 text-xs text-slate-400">
                  Immagine principale: <span className="text-slate-200">{primaryImage.file.name}</span>
                </p>
              ) : null}
            </div>

            <label className="flex items-center gap-3 md:col-span-2">
              <input
                checked={form.visited}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-400"
                name="visited"
                type="checkbox"
                onChange={updateCheckbox}
              />
              <span className="text-sm text-slate-200">Segna come visitato</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <button
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || isSavingPeriod}
              type="submit"
            >
              {isSubmitting ? 'Salvataggio…' : 'Salva luogo'}
            </button>

            <p className="text-sm text-slate-400">
              Le immagini rimangono locali fino al salvataggio, poi vengono caricate nel bucket pubblico <code className="rounded bg-slate-800 px-1.5 py-0.5">places</code>.
            </p>
          </div>
        </form>
      </section>
    </main>
  )
}

export default AddPlace
