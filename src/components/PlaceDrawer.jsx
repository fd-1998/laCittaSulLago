import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import CoordinatePicker from './CoordinatePicker'
import ImageUploader from './ImageUploader'
import { AddIcon, CloseIcon, TimelineIcon } from './UiIcons'
import {
  createHistoricalLayer,
  deleteLayerImages,
  fetchPlaceById,
  insertLayerImage,
  updateHistoricalLayer,
  updatePlace,
} from '../services/places'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

const initialNewLayerForm = {
  title: '',
  short_description: '',
  long_description: '',
  start_year: '',
  end_year: '',
  period_id: '',
  marker_color: '#38bdf8',
  marker_icon: '',
}

const buildLayerForm = (layer) => ({
  title: layer?.title ?? '',
  short_description: layer?.short_description ?? '',
  long_description: layer?.long_description ?? '',
  start_year: layer?.start_year ?? '',
  end_year: layer?.end_year ?? '',
  period_id: layer?.historical_period_id ?? '',
  marker_color: layer?.marker_color ?? '#38bdf8',
  marker_icon: layer?.marker_icon ?? '',
})

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
    imageUrl: null,
    caption: file.name,
    isPrimary,
    source: 'file',
    revokeUrl: true,
  }
}

function createUrlPreviewItem(url, isPrimary = false) {
  const trimmedUrl = url.trim()
  const fileName = trimmedUrl.split('/').pop() || 'immagine-link'
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file: {
      name: fileName,
      size: 0,
    },
    previewUrl: trimmedUrl,
    imageUrl: trimmedUrl,
    caption: fileName,
    isPrimary,
    source: 'url',
    revokeUrl: false,
  }
}

function mapExistingImages(layer) {
  return (layer?.place_images ?? []).map((image) => {
    const url = image.thumbnail_url || image.image_url
    return {
      id: image.id,
      file: {
        name: image.caption || url?.split('/').pop() || 'immagine',
        size: 0,
      },
      previewUrl: url,
      imageUrl: image.image_url || url,
      caption: image.caption,
      isPrimary: Boolean(image.is_primary),
      source: 'existing',
      revokeUrl: false,
    }
  })
}

function cleanupImages(items) {
  items.forEach((image) => {
    if (image.revokeUrl) {
      URL.revokeObjectURL(image.previewUrl)
    }
  })
}

async function uploadImages({ images, layerId, placeId }) {
  const urlImages = images.filter((image) => image.source === 'url' || image.source === 'existing')
  const fileImages = images.filter((image) => image.source === 'file')

  const payloads = []

  urlImages.forEach((image) => {
    const url = image.imageUrl || image.previewUrl
    if (!url) {
      return
    }

    payloads.push({
      historical_layer_id: layerId,
      image_url: url,
      thumbnail_url: url,
      caption: image.caption || image.file?.name,
      is_primary: image.isPrimary,
    })
  })

  if (fileImages.length) {
    const uploadResults = await Promise.all(
      fileImages.map(async (image, index) => {
        const safeFileName = image.file.name.replace(/[^a-z0-9._-]/gi, '_')
        const filePath = `public/${placeId}/${Date.now()}-${index}-${safeFileName}`
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
            historical_layer_id: layerId,
            image_url: publicData.publicUrl,
            thumbnail_url: publicData.publicUrl,
            caption: image.caption || image.file.name,
            is_primary: image.isPrimary,
          },
        }
      }),
    )

    const successful = uploadResults.filter((result) => result.status === 'fulfilled')
    const failed = uploadResults.filter((result) => result.status === 'rejected')

    successful.forEach((result) => payloads.push(result.payload))

    if (failed.length) {
      return { payloads, error: failed[0]?.error ?? new Error('Errore nel caricamento immagini') }
    }
  }

  return { payloads, error: null }
}

function LayerSection({
  place,
  layer,
  periods,
  isActive,
  onSelectLayer,
  onPlaceUpdated,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(() => buildLayerForm(layer))
  const [editImages, setEditImages] = useState(() => mapExistingImages(layer))
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imageUrlError, setImageUrlError] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const imagesRef = useRef([])

  const tags = place.place_tags?.map((tag) => tag.tags?.name).filter(Boolean) ?? []
  const podcasts =
    layer.place_podcast_episodes?.map((entry) => entry.podcast_episodes).filter(Boolean) ?? []
  const notes = layer.notes ?? []
  const period = layer.historical_periods

  useEffect(() => {
    imagesRef.current = editImages
  }, [editImages])

  useEffect(() => {
    return () => {
      cleanupImages(imagesRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isEditing) {
      setForm(buildLayerForm(layer))
      setEditImages(mapExistingImages(layer))
    }
  }, [layer, isEditing])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
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

    setEditImages((current) => {
      const nextItems = accepted.map((file, index) => createPreviewItem(file, current.length === 0 && index === 0))

      if (!current.some((image) => image.isPrimary) && nextItems.length) {
        nextItems[0] = { ...nextItems[0], isPrimary: true }
      }

      return [...current, ...nextItems]
    })
  }

  function removeImage(imageId) {
    setEditImages((current) => {
      const removed = current.find((image) => image.id === imageId)
      if (removed?.revokeUrl) {
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
    setEditImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })))
  }

  function handleAddImageUrl() {
    const trimmed = imageUrlInput.trim()
    if (!trimmed) {
      setImageUrlError('Inserisci un link valido.')
      return
    }

    let parsedUrl = null
    try {
      parsedUrl = new URL(trimmed)
    } catch {
      setImageUrlError('Il link non è valido.')
      return
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setImageUrlError('Il link deve iniziare con http o https.')
      return
    }

    setImageUrlError('')
    setEditImages((current) => {
      const isPrimary = !current.some((image) => image.isPrimary)
      return [...current, createUrlPreviewItem(trimmed, isPrimary)]
    })
    setImageUrlInput('')
  }

  function cancelEdit() {
    setIsEditing(false)
    setError('')
    setImageUrlError('')
    setImageUrlInput('')
    cleanupImages(editImages)
    setEditImages(mapExistingImages(layer))
    setForm(buildLayerForm(layer))
  }

  async function handleSave() {
    setError('')

    const startYear = Number(form.start_year)
    const endYear = Number(form.end_year)
    const resolvedPeriodId = resolvePeriodId(form.period_id)

    if (!form.title.trim() || !form.short_description.trim() || !form.long_description.trim()) {
      setError('Compila il titolo del livello, la descrizione breve e la descrizione estesa.')
      return
    }

    if (!form.period_id || resolvedPeriodId == null) {
      setError('Seleziona un periodo storico valido.')
      return
    }

    if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
      setError('Anno inizio e anno fine devono essere numeri validi.')
      return
    }

    if (startYear > endYear) {
      setError("L'anno di inizio deve essere minore o uguale all'anno di fine.")
      return
    }

    if (editImages.some((image) => image.file.size > MAX_IMAGE_SIZE)) {
      setError('Una o più immagini sono troppo grandi. Ogni file deve essere massimo 10 MB.')
      return
    }

    setIsSaving(true)

    const { error: layerError } = await updateHistoricalLayer(layer.id, {
      title: form.title.trim(),
      short_description: form.short_description.trim(),
      long_description: form.long_description.trim(),
      start_year: startYear,
      end_year: endYear,
      historical_period_id: resolvedPeriodId,
      marker_color: form.marker_color || '#38bdf8',
      marker_icon: form.marker_icon?.trim() || null,
    })

    if (layerError) {
      setIsSaving(false)
      setError(layerError.message || 'Errore durante il salvataggio del livello storico.')
      return
    }

    const { error: deleteError } = await deleteLayerImages(layer.id)
    if (deleteError) {
      setIsSaving(false)
      setError(deleteError.message || 'Errore durante la sostituzione delle immagini.')
      return
    }

    if (editImages.length) {
      const { payloads, error: uploadError } = await uploadImages({
        images: editImages,
        layerId: layer.id,
        placeId: place.id,
      })

      if (uploadError) {
        setIsSaving(false)
        setError(uploadError.message || 'Errore durante il caricamento delle immagini.')
        return
      }

      if (payloads.length) {
        const { error: insertError } = await insertLayerImage(payloads)
        if (insertError) {
          setIsSaving(false)
          setError('Le modifiche sono state salvate, ma non è stato possibile collegare le immagini.')
          return
        }
      }
    }

    const { data: updatedPlace, error: reloadError } = await fetchPlaceById(place.id)
    if (reloadError) {
      setIsSaving(false)
      setError('Modifiche salvate, ma non è stato possibile ricaricare il luogo.')
      return
    }

    onPlaceUpdated?.(updatedPlace)
    setIsSaving(false)
    setIsEditing(false)
  }

  return (
    <article className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              {period?.name ?? 'Periodo storico'}
            </p>
            {isActive ? (
              <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Attivo
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {layer.title ?? place.canonical_name ?? 'Luogo storico'}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {layer.start_year} → {layer.end_year}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectLayer?.(layer)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
          >
            Mostra sulla mappa
          </button>
          <button
            type="button"
            onClick={isEditing ? cancelEdit : () => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
          >
            {isEditing ? 'Annulla' : 'Modifica'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
            {error}
          </div>
        ) : null}

        {isEditing ? (
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Titolo livello storico</span>
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="title"
                value={form.title}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Descrizione breve</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="short_description"
                value={form.short_description}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Descrizione estesa</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="long_description"
                value={form.long_description}
                onChange={updateField}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Anno inizio</span>
                <input
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="start_year"
                  type="number"
                  value={form.start_year}
                  onChange={updateField}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Anno fine</span>
                <input
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="end_year"
                  type="number"
                  value={form.end_year}
                  onChange={updateField}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Colore marker</span>
                <input
                  className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="marker_color"
                  type="color"
                  value={form.marker_color}
                  onChange={updateField}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Icona marker (opzionale)</span>
                <input
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="marker_icon"
                  value={form.marker_icon}
                  onChange={updateField}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Periodo storico</span>
              <select
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                name="period_id"
                value={form.period_id}
                onChange={updateField}
              >
                <option value="">Seleziona un periodo</option>
                {periods.map((periodItem) => (
                  <option key={periodItem.id} value={periodItem.id}>
                    {periodItem.name} ({periodItem.start_year} → {periodItem.end_year})
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-medium text-slate-200">Aggiungi immagine da link</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input
                    className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    placeholder="https://..."
                    value={imageUrlInput}
                    onChange={(event) => setImageUrlInput(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Aggiungi link
                  </button>
                </div>
                {imageUrlError ? (
                  <p className="mt-2 text-xs text-rose-300">{imageUrlError}</p>
                ) : null}
              </div>

              <ImageUploader
                disabled={isSaving}
                images={editImages}
                onAddFiles={validateAndAddFiles}
                onMarkPrimary={markPrimaryImage}
                onRemoveImage={removeImage}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="button"
                onClick={handleSave}
              >
                {isSaving ? 'Salvataggio…' : 'Salva modifiche'}
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
                type="button"
                onClick={cancelEdit}
              >
                Annulla modifiche
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-6 text-slate-300">{layer.long_description}</p>

            <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cronologia</p>
                <p className="mt-1 text-slate-200">
                  {layer.start_year} → {layer.end_year}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Periodo</p>
                <p className="mt-1 text-slate-200">{period?.name ?? '—'}</p>
              </div>
              {tags.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tag</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {podcasts.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Podcast</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-300">
                    {podcasts.map((episode) => (
                      <li key={episode.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-sm font-semibold text-white">{episode.title}</p>
                        <p className="mt-1 text-slate-400">{episode.short_description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {notes.length ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Note</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-300">
                    {notes.map((note) => (
                      <li key={note.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-sm font-semibold text-white">{note.title}</p>
                        {note.subtitle ? <p className="mt-1 text-slate-400">{note.subtitle}</p> : null}
                        {note.content ? <p className="mt-2 text-slate-400">{note.content}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function PlaceDrawer({
  place,
  activeLayer,
  periods = [],
  onSelectLayer,
  onClose,
  onToggleVisited,
  onPlaceUpdated,
}) {
  const [isEditingPlace, setIsEditingPlace] = useState(false)
  const [placeForm, setPlaceForm] = useState({
    canonical_name: place?.canonical_name ?? '',
    latitude: place?.latitude ?? '',
    longitude: place?.longitude ?? '',
  })
  const [placeError, setPlaceError] = useState('')
  const [isSavingPlace, setIsSavingPlace] = useState(false)
  const [isAddingLayer, setIsAddingLayer] = useState(false)
  const [newLayerForm, setNewLayerForm] = useState(initialNewLayerForm)
  const [newLayerImages, setNewLayerImages] = useState([])
  const [newLayerUrlInput, setNewLayerUrlInput] = useState('')
  const [newLayerUrlError, setNewLayerUrlError] = useState('')
  const [isCreatingLayer, setIsCreatingLayer] = useState(false)
  const newLayerImagesRef = useRef([])

  const layers = useMemo(() => {
    const list = place?.place_historical_layers ?? []
    return [...list].sort((a, b) => (a?.start_year ?? 0) - (b?.start_year ?? 0))
  }, [place])

  const placeGallery = useMemo(() => {
    const allImages = place?.place_historical_layers
      ?.flatMap((entry) => entry?.place_images ?? [])
      .filter(Boolean) ?? []

    const sorted = [...allImages].sort((a, b) => {
      if (a?.is_primary && !b?.is_primary) return -1
      if (!a?.is_primary && b?.is_primary) return 1
      return 0
    })

    const seen = new Set()
    return sorted.filter((image) => {
      const key = image.thumbnail_url || image.image_url || image.id
      if (!key || seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }, [place])

  useEffect(() => {
    setPlaceForm({
      canonical_name: place?.canonical_name ?? '',
      latitude: place?.latitude ?? '',
      longitude: place?.longitude ?? '',
    })
  }, [place])

  useEffect(() => {
    newLayerImagesRef.current = newLayerImages
  }, [newLayerImages])

  useEffect(() => {
    return () => {
      cleanupImages(newLayerImagesRef.current)
    }
  }, [])

  if (!place) {
    return null
  }

  function updatePlaceField(event) {
    const { name, value } = event.target
    setPlaceForm((current) => ({ ...current, [name]: value }))
  }

  function updateNewLayerField(event) {
    const { name, value } = event.target
    setNewLayerForm((current) => ({ ...current, [name]: value }))
  }

  function updateCoordinates({ latitude, longitude }) {
    setPlaceForm((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }))
  }

  function validateAndAddNewLayerFiles(fileList) {
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
      setPlaceError(rejected.join(' · '))
    } else {
      setPlaceError('')
    }

    if (!accepted.length) {
      return
    }

    setNewLayerImages((current) => {
      const nextItems = accepted.map((file, index) => createPreviewItem(file, current.length === 0 && index === 0))

      if (!current.some((image) => image.isPrimary) && nextItems.length) {
        nextItems[0] = { ...nextItems[0], isPrimary: true }
      }

      return [...current, ...nextItems]
    })
  }

  function removeNewLayerImage(imageId) {
    setNewLayerImages((current) => {
      const removed = current.find((image) => image.id === imageId)
      if (removed?.revokeUrl) {
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

  function markPrimaryNewLayerImage(imageId) {
    setNewLayerImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })))
  }

  function handleAddNewLayerImageUrl() {
    const trimmed = newLayerUrlInput.trim()
    if (!trimmed) {
      setNewLayerUrlError('Inserisci un link valido.')
      return
    }

    let parsedUrl = null
    try {
      parsedUrl = new URL(trimmed)
    } catch {
      setNewLayerUrlError('Il link non è valido.')
      return
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setNewLayerUrlError('Il link deve iniziare con http o https.')
      return
    }

    setNewLayerUrlError('')
    setNewLayerImages((current) => {
      const isPrimary = !current.some((image) => image.isPrimary)
      return [...current, createUrlPreviewItem(trimmed, isPrimary)]
    })
    setNewLayerUrlInput('')
  }

  async function handleSavePlace() {
    setPlaceError('')

    const latitude = Number(placeForm.latitude)
    const longitude = Number(placeForm.longitude)

    if (!placeForm.canonical_name.trim()) {
      setPlaceError('Compila il nome canonico del luogo.')
      return
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setPlaceError('Latitudine e longitudine devono essere numeri validi.')
      return
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setPlaceError('La latitudine deve essere tra -90 e 90 e la longitudine tra -180 e 180.')
      return
    }

    setIsSavingPlace(true)

    const { error: placeError } = await updatePlace(place.id, {
      canonical_name: placeForm.canonical_name.trim(),
      latitude,
      longitude,
    })

    if (placeError) {
      setIsSavingPlace(false)
      setPlaceError(placeError.message)
      return
    }

    const { data: updatedPlace, error: reloadError } = await fetchPlaceById(place.id)
    if (reloadError) {
      setIsSavingPlace(false)
      setPlaceError('Modifiche salvate, ma non è stato possibile ricaricare il luogo.')
      return
    }

    onPlaceUpdated?.(updatedPlace)
    setIsSavingPlace(false)
    setIsEditingPlace(false)
  }

  async function handleCreateLayer() {
    setPlaceError('')

    const startYear = Number(newLayerForm.start_year)
    const endYear = Number(newLayerForm.end_year)
    const resolvedPeriodId = resolvePeriodId(newLayerForm.period_id)

    if (!newLayerForm.title.trim() || !newLayerForm.short_description.trim() || !newLayerForm.long_description.trim()) {
      setPlaceError('Compila il titolo del livello, la descrizione breve e la descrizione estesa.')
      return
    }

    if (!newLayerForm.period_id || resolvedPeriodId == null) {
      setPlaceError('Seleziona un periodo storico valido per il nuovo livello.')
      return
    }

    if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
      setPlaceError('Anno inizio e anno fine devono essere numeri validi per il nuovo livello.')
      return
    }

    if (startYear > endYear) {
      setPlaceError("L'anno di inizio deve essere minore o uguale all'anno di fine.")
      return
    }

    if (newLayerImages.some((image) => image.file.size > MAX_IMAGE_SIZE)) {
      setPlaceError('Una o più immagini del nuovo livello sono troppo grandi.')
      return
    }

    setIsCreatingLayer(true)

    const { data: layerData, error: layerError } = await createHistoricalLayer({
      place_id: place.id,
      historical_period_id: resolvedPeriodId,
      title: newLayerForm.title.trim(),
      short_description: newLayerForm.short_description.trim(),
      long_description: newLayerForm.long_description.trim(),
      start_year: startYear,
      end_year: endYear,
      marker_color: newLayerForm.marker_color || '#38bdf8',
      marker_icon: newLayerForm.marker_icon?.trim() || null,
    })

    if (layerError) {
      setIsCreatingLayer(false)
      setPlaceError(layerError.message || 'Errore durante la creazione del livello storico.')
      return
    }

    if (layerData?.id && newLayerImages.length) {
      const { payloads, error: uploadError } = await uploadImages({
        images: newLayerImages,
        layerId: layerData.id,
        placeId: place.id,
      })

      if (uploadError) {
        setIsCreatingLayer(false)
        setPlaceError(uploadError.message || 'Errore durante il caricamento delle immagini.')
        return
      }

      if (payloads.length) {
        const { error: insertError } = await insertLayerImage(payloads)
        if (insertError) {
          setIsCreatingLayer(false)
          setPlaceError('Il livello è stato creato, ma non è stato possibile collegare le immagini.')
          return
        }
      }
    }

    const { data: updatedPlace, error: reloadError } = await fetchPlaceById(place.id)
    if (reloadError) {
      setIsCreatingLayer(false)
      setPlaceError('Livello creato, ma non è stato possibile ricaricare il luogo.')
      return
    }

    onPlaceUpdated?.(updatedPlace)
    onSelectLayer?.(layerData)
    setNewLayerForm(initialNewLayerForm)
    cleanupImages(newLayerImages)
    setNewLayerImages([])
    setNewLayerUrlInput('')
    setNewLayerUrlError('')
    setIsAddingLayer(false)
    setIsCreatingLayer(false)
  }

  return (
    <aside className="pointer-events-auto flex w-full max-w-xl flex-col rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl backdrop-blur lg:h-full lg:max-h-full lg:overflow-y-auto lg:overscroll-contain lg:touch-pan-y">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-4 flex items-start justify-between gap-4 border-b border-slate-800/70 bg-slate-950/95 px-6 pt-6 pb-4 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Scheda luogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {place.canonical_name ?? 'Luogo storico'}
          </h2>
          {activeLayer?.title ? (
            <p className="mt-1 text-sm text-slate-400">Layer attivo: {activeLayer.title}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Chiudi dettagli luogo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
            type="button"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-6 pr-1 lg:pb-6">
        {placeError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
            {placeError}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Dati luogo</p>
              <p className="mt-2 text-sm text-slate-300">Coordinate e nome canonico</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingPlace((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
            >
              {isEditingPlace ? 'Annulla' : 'Modifica'}
            </button>
          </div>

          {isEditingPlace ? (
            <div className="mt-4 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Nome canonico</span>
                <input
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="canonical_name"
                  value={placeForm.canonical_name}
                  onChange={updatePlaceField}
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Latitudine</span>
                  <input
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    name="latitude"
                    type="number"
                    step="any"
                    value={placeForm.latitude}
                    onChange={updatePlaceField}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Longitudine</span>
                  <input
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    name="longitude"
                    type="number"
                    step="any"
                    value={placeForm.longitude}
                    onChange={updatePlaceField}
                  />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Selettore coordinate</span>
                <CoordinatePicker
                  value={{
                    latitude: placeForm.latitude ? Number(placeForm.latitude) : null,
                    longitude: placeForm.longitude ? Number(placeForm.longitude) : null,
                  }}
                  onChange={updateCoordinates}
                />
              </label>
              <button
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingPlace}
                type="button"
                onClick={handleSavePlace}
              >
                {isSavingPlace ? 'Salvataggio…' : 'Salva dati luogo'}
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Coordinate</p>
                <p className="mt-1 text-slate-200">
                  {place.latitude}, {place.longitude}
                </p>
              </div>
            </div>
          )}

          {placeGallery.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Galleria</p>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {placeGallery.map((image) => (
                  <img
                    key={image.id}
                    alt={image.caption || place.canonical_name || 'Immagine luogo'}
                    className="h-24 w-36 flex-shrink-0 rounded-2xl object-cover"
                    src={image.thumbnail_url || image.image_url}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
              type="button"
              onClick={onToggleVisited}
            >
              <TimelineIcon className="h-4 w-4" />
              {place.visited ? 'Visitato' : 'Non visitato'}
            </button>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Livelli storici</p>
            <p className="mt-1 text-sm text-slate-400">
              Ogni epoca è separata e modificabile singolarmente.
            </p>
          </div>
          <div className="space-y-6">
            {layers.map((layer) => (
              <LayerSection
                key={layer.id}
                place={place}
                layer={layer}
                periods={periods}
                isActive={activeLayer?.id === layer.id}
                onSelectLayer={onSelectLayer}
                onPlaceUpdated={onPlaceUpdated}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Nuovo livello storico</p>
              <p className="mt-1 text-xs text-slate-400">
                Aggiungi un periodo storico aggiuntivo per questo luogo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingLayer((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
            >
              <AddIcon className="h-4 w-4" />
              {isAddingLayer ? 'Annulla' : 'Aggiungi'}
            </button>
          </div>

          {isAddingLayer ? (
            <div className="mt-4 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Titolo livello storico</span>
                <input
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="title"
                  value={newLayerForm.title}
                  onChange={updateNewLayerField}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Descrizione breve</span>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="short_description"
                  value={newLayerForm.short_description}
                  onChange={updateNewLayerField}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Descrizione estesa</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="long_description"
                  value={newLayerForm.long_description}
                  onChange={updateNewLayerField}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Anno inizio</span>
                  <input
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    name="start_year"
                    type="number"
                    value={newLayerForm.start_year}
                    onChange={updateNewLayerField}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Anno fine</span>
                  <input
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    name="end_year"
                    type="number"
                    value={newLayerForm.end_year}
                    onChange={updateNewLayerField}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Colore marker</span>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    name="marker_color"
                    type="color"
                    value={newLayerForm.marker_color}
                    onChange={updateNewLayerField}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Icona marker (opzionale)</span>
                  <input
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    name="marker_icon"
                    value={newLayerForm.marker_icon}
                    onChange={updateNewLayerField}
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Periodo storico</span>
                <select
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  name="period_id"
                  value={newLayerForm.period_id}
                  onChange={updateNewLayerField}
                >
                  <option value="">Seleziona un periodo</option>
                  {periods.map((periodItem) => (
                    <option key={periodItem.id} value={periodItem.id}>
                      {periodItem.name} ({periodItem.start_year} → {periodItem.end_year})
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm font-medium text-slate-200">Aggiungi immagine da link</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="https://..."
                      value={newLayerUrlInput}
                      onChange={(event) => setNewLayerUrlInput(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewLayerImageUrl}
                      className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Aggiungi link
                    </button>
                  </div>
                  {newLayerUrlError ? (
                    <p className="mt-2 text-xs text-rose-300">{newLayerUrlError}</p>
                  ) : null}
                </div>

                <ImageUploader
                  disabled={isCreatingLayer}
                  images={newLayerImages}
                  onAddFiles={validateAndAddNewLayerFiles}
                  onMarkPrimary={markPrimaryNewLayerImage}
                  onRemoveImage={removeNewLayerImage}
                />
              </div>

              <button
                type="button"
                onClick={handleCreateLayer}
                disabled={isCreatingLayer}
                className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingLayer ? 'Salvataggio…' : 'Crea livello'}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </aside>
  )
}

export default PlaceDrawer
