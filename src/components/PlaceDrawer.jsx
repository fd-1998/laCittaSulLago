import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Expand,
  Headphones,
  Images,
  MapPin,
  Pencil,
  Plus,
  Upload,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  createHistoricalLayer,
  fetchPlaceById,
  fetchTags,
  insertLayerImage,
  replaceLayerImages,
  updateHistoricalLayer,
  updatePlace,
  updatePlaceTags,
} from '../services/places'
import {
  buildImagePayloads,
  cleanupDrafts,
  createFileDraft,
  createUrlDraft,
  draftsFromImages,
  validateImageFiles,
} from '../lib/imageDrafts'
import ImageUploader from './ImageUploader'

const emptyLayer = {
  title: '',
  short_description: '',
  long_description: '',
  start_year: '',
  end_year: '',
  historical_period_id: '',
  marker_color: '#D27271',
  marker_icon: '',
}

function formatYear(year) {
  const numeric = Number(year)
  if (Number.isNaN(numeric)) return year
  return numeric < 0 ? `${Math.abs(numeric).toLocaleString('it-IT')} a.C.` : `${numeric} d.C.`
}

function imageUrl(image) {
  return image?.image_url || image?.thumbnail_url || ''
}

function SafeImage({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <span className="place-image-fallback"><Images aria-hidden="true" /> Immagine non disponibile</span>
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} />
}

function Gallery({ images, placeName, onOpen }) {
  const [index, setIndex] = useState(0)

  if (!images.length) {
    return (
      <div className="place-panel-empty">
        <Images aria-hidden="true" />
        <span>Nessuna immagine disponibile.</span>
      </div>
    )
  }

  const visibleIndex = Math.min(index, images.length - 1)
  const image = images[visibleIndex]

  return (
    <div className="place-gallery">
      <button className="place-gallery-image" type="button" onClick={() => onOpen(visibleIndex)}>
        <SafeImage
          key={imageUrl(image)}
          src={image.thumbnail_url || image.image_url}
          alt={image.caption || placeName}
        />
        <Expand aria-hidden="true" />
      </button>
      {images.length > 1 ? (
        <>
          <button
            className="place-gallery-arrow is-left"
            type="button"
            onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}
            aria-label="Immagine precedente"
          >
            <ChevronLeft />
          </button>
          <button
            className="place-gallery-arrow is-right"
            type="button"
            onClick={() => setIndex((current) => (current + 1) % images.length)}
            aria-label="Immagine successiva"
          >
            <ChevronRight />
          </button>
          <span className="place-gallery-count">{visibleIndex + 1} / {images.length}</span>
        </>
      ) : null}
    </div>
  )
}

function Lightbox({ images, index, placeName, onClose, onChange }) {
  const image = images[index]
  if (!image) return null

  return (
    <div className="place-lightbox" role="dialog" aria-modal="true" aria-label="Galleria immagini">
      <button className="place-lightbox-close" type="button" onClick={onClose} aria-label="Chiudi galleria">
        <X />
      </button>
      {images.length > 1 ? (
        <>
          <button
            className="place-lightbox-arrow is-left"
            type="button"
            onClick={() => onChange((index - 1 + images.length) % images.length)}
            aria-label="Immagine precedente"
          >
            <ChevronLeft />
          </button>
          <button
            className="place-lightbox-arrow is-right"
            type="button"
            onClick={() => onChange((index + 1) % images.length)}
            aria-label="Immagine successiva"
          >
            <ChevronRight />
          </button>
        </>
      ) : null}
      <figure>
        <SafeImage src={imageUrl(image)} alt={image.caption || placeName} />
        <figcaption>
          <span>{image.caption || placeName}</span>
          <span>{index + 1} / {images.length}</span>
        </figcaption>
      </figure>
    </div>
  )
}

function PlaceEditor({ place, layer, periods, onSaved, onCancel }) {
  const [placeForm, setPlaceForm] = useState({
    canonical_name: place.canonical_name ?? '',
    latitude: place.latitude ?? '',
    longitude: place.longitude ?? '',
  })
  const [layerForm, setLayerForm] = useState({
    ...emptyLayer,
    ...layer,
    historical_period_id: layer?.historical_period_id ?? '',
  })
  const [tags, setTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => new Set(place.place_tags?.map((entry) => entry.tags?.id).filter(Boolean) ?? []),
  )
  const [images, setImages] = useState(() => draftsFromImages(layer?.place_images))
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const imagesRef = useRef(images)

  useEffect(() => {
    fetchTags().then(({ data, error: tagsError }) => {
      if (tagsError) setError(tagsError.message)
      else setTags(data ?? [])
    })
  }, [])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => () => cleanupDrafts(imagesRef.current), [])

  function addFiles(fileList) {
    const { accepted, rejected } = validateImageFiles(fileList)
    if (rejected.length) setError(rejected.join(' · '))
    if (!accepted.length) return
    setImages((current) => [
      ...current,
      ...accepted.map((file, index) => createFileDraft(
        file,
        !current.some((item) => item.isPrimary) && index === 0,
      )),
    ])
  }

  function removeImage(id) {
    setImages((current) => {
      const removed = current.find((item) => item.id === id)
      if (removed?.revokeUrl) URL.revokeObjectURL(removed.previewUrl)
      const next = current.filter((item) => item.id !== id)
      if (next.length && !next.some((item) => item.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true }
      }
      return next
    })
  }

  async function save() {
    setError('')
    const latitude = Number(placeForm.latitude)
    const longitude = Number(placeForm.longitude)
    const startYear = Number(layerForm.start_year)
    const endYear = Number(layerForm.end_year)
    if (!placeForm.canonical_name.trim() || !layerForm.title.trim()) {
      setError('Nome del luogo e titolo del livello sono obbligatori.')
      return
    }
    if ([latitude, longitude, startYear, endYear].some(Number.isNaN)) {
      setError('Coordinate e anni devono essere numeri validi.')
      return
    }
    if (startYear > endYear) {
      setError("L'anno iniziale non può essere successivo a quello finale.")
      return
    }

    setSaving(true)
    try {
      const { error: placeError } = await updatePlace(place.id, {
        canonical_name: placeForm.canonical_name.trim(),
        latitude,
        longitude,
      })
      if (placeError) throw placeError

      const { error: tagsError } = await updatePlaceTags(place.id, [...selectedTagIds])
      if (tagsError) throw tagsError

      const { error: layerError } = await updateHistoricalLayer(layer.id, {
        historical_period_id: layerForm.historical_period_id || null,
        title: layerForm.title.trim(),
        short_description: layerForm.short_description?.trim() || null,
        long_description: layerForm.long_description?.trim() || null,
        start_year: startYear,
        end_year: endYear,
        marker_color: layerForm.marker_color || null,
        marker_icon: layerForm.marker_icon?.trim() || null,
      })
      if (layerError) throw layerError

      const payloads = await buildImagePayloads(images, layer.id, place.id)
      const { error: imagesError } = await replaceLayerImages(layer.id, payloads)
      if (imagesError) throw imagesError

      const { data: refreshed, error: refreshError } = await fetchPlaceById(place.id)
      if (refreshError) throw refreshError
      onSaved(refreshed)
    } catch (saveError) {
      setError(saveError.message || 'Non è stato possibile salvare le modifiche.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="place-editor">
      <div className="place-editor-heading">
        <div>
          <span className="place-panel-kicker">Modalità modifica</span>
          <h3>Aggiorna luogo e racconto</h3>
        </div>
        <button type="button" onClick={onCancel}>Annulla</button>
      </div>

      {error ? <div className="place-panel-error" role="alert">{error}</div> : null}

      <div className="place-editor-grid">
        <label>
          <span>Nome del luogo</span>
          <input
            value={placeForm.canonical_name}
            onChange={(event) => setPlaceForm((current) => ({ ...current, canonical_name: event.target.value }))}
          />
        </label>
        <label>
          <span>Titolo del racconto</span>
          <input
            value={layerForm.title}
            onChange={(event) => setLayerForm((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label>
          <span>Latitudine</span>
          <input
            type="number"
            value={placeForm.latitude}
            onChange={(event) => setPlaceForm((current) => ({ ...current, latitude: event.target.value }))}
          />
        </label>
        <label>
          <span>Longitudine</span>
          <input
            type="number"
            value={placeForm.longitude}
            onChange={(event) => setPlaceForm((current) => ({ ...current, longitude: event.target.value }))}
          />
        </label>
        <label>
          <span>Anno iniziale</span>
          <input
            type="number"
            value={layerForm.start_year}
            onChange={(event) => setLayerForm((current) => ({ ...current, start_year: event.target.value }))}
          />
        </label>
        <label>
          <span>Anno finale</span>
          <input
            type="number"
            value={layerForm.end_year}
            onChange={(event) => setLayerForm((current) => ({ ...current, end_year: event.target.value }))}
          />
        </label>
        <label>
          <span>Colore marker</span>
          <input
            type="color"
            value={layerForm.marker_color || '#D27271'}
            onChange={(event) => setLayerForm((current) => ({ ...current, marker_color: event.target.value }))}
          />
        </label>
        <label>
          <span>Icona marker</span>
          <input
            value={layerForm.marker_icon ?? ''}
            placeholder="Opzionale"
            onChange={(event) => setLayerForm((current) => ({ ...current, marker_icon: event.target.value }))}
          />
        </label>
        <label className="is-wide">
          <span>Periodo storico</span>
          <select
            value={layerForm.historical_period_id}
            onChange={(event) => setLayerForm((current) => ({
              ...current,
              historical_period_id: event.target.value,
            }))}
          >
            <option value="">Nessun periodo</option>
            {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
          </select>
        </label>
        <label className="is-wide">
          <span>Descrizione breve</span>
          <textarea
            rows="3"
            value={layerForm.short_description ?? ''}
            onChange={(event) => setLayerForm((current) => ({ ...current, short_description: event.target.value }))}
          />
        </label>
        <label className="is-wide">
          <span>Racconto esteso</span>
          <textarea
            rows="7"
            value={layerForm.long_description ?? ''}
            onChange={(event) => setLayerForm((current) => ({ ...current, long_description: event.target.value }))}
          />
        </label>
      </div>

      <fieldset className="place-tag-editor">
        <legend>Itinerari e tag</legend>
        <div>
          {tags.map((tag) => (
            <label key={tag.id}>
              <input
                type="checkbox"
                checked={selectedTagIds.has(tag.id)}
                onChange={() => setSelectedTagIds((current) => {
                  const next = new Set(current)
                  if (next.has(tag.id)) next.delete(tag.id)
                  else next.add(tag.id)
                  return next
                })}
              />
              <span>{tag.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ImageUploader
        images={images}
        onAddFiles={addFiles}
        onMarkPrimary={(id) => setImages((current) => current.map((item) => ({ ...item, isPrimary: item.id === id })))}
        onRemoveImage={removeImage}
        disabled={saving}
      />
      <div className="place-image-url">
        <label>
          <span>Oppure aggiungi un’immagine da URL</span>
          <input
            type="url"
            value={imageUrl}
            placeholder="https://…"
            onChange={(event) => setImageUrl(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            try {
              const parsed = new URL(imageUrl)
              if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
              setImages((current) => [
                ...current,
                createUrlDraft(imageUrl, !current.some((item) => item.isPrimary)),
              ])
              setImageUrl('')
              setError('')
            } catch {
              setError('Inserisci un URL immagine valido.')
            }
          }}
        >
          Aggiungi URL
        </button>
      </div>

      <button className="place-save-button" type="button" onClick={save} disabled={saving}>
        <Check aria-hidden="true" />
        {saving ? 'Salvataggio in corso…' : 'Salva tutte le modifiche'}
      </button>
    </div>
  )
}

function NewLayerForm({ place, periods, onCreated, onCancel }) {
  const [form, setForm] = useState(emptyLayer)
  const [images, setImages] = useState([])
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function create() {
    const startYear = Number(form.start_year)
    const endYear = Number(form.end_year)
    if (!form.title.trim() || Number.isNaN(startYear) || Number.isNaN(endYear)) {
      setError('Inserisci almeno titolo, anno iniziale e anno finale.')
      return
    }
    setSaving(true)
    try {
      const { data: layer, error: layerError } = await createHistoricalLayer({
        place_id: place.id,
        historical_period_id: form.historical_period_id || null,
        title: form.title.trim(),
        short_description: form.short_description?.trim() || null,
        long_description: form.long_description?.trim() || null,
        start_year: startYear,
        end_year: endYear,
        marker_color: form.marker_color,
        marker_icon: form.marker_icon?.trim() || null,
      })
      if (layerError) throw layerError
      if (images.length) {
        const payloads = await buildImagePayloads(images, layer.id, place.id)
        const { error: imageError } = await insertLayerImage(payloads)
        if (imageError) throw imageError
      }
      const { data: refreshed, error: refreshError } = await fetchPlaceById(place.id)
      if (refreshError) throw refreshError
      onCreated(refreshed, layer)
    } catch (createError) {
      setError(createError.message || 'Non è stato possibile creare il livello.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="place-editor">
      <div className="place-editor-heading">
        <div><span className="place-panel-kicker">Nuovo livello</span><h3>Aggiungi un’epoca</h3></div>
        <button type="button" onClick={onCancel}>Annulla</button>
      </div>
      {error ? <div className="place-panel-error">{error}</div> : null}
      <div className="place-editor-grid">
        <label className="is-wide">
          <span>Titolo</span>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label>
          <span>Anno iniziale</span>
          <input type="number" value={form.start_year} onChange={(event) => setForm((current) => ({ ...current, start_year: event.target.value }))} />
        </label>
        <label>
          <span>Anno finale</span>
          <input type="number" value={form.end_year} onChange={(event) => setForm((current) => ({ ...current, end_year: event.target.value }))} />
        </label>
        <label className="is-wide">
          <span>Periodo</span>
          <select value={form.historical_period_id} onChange={(event) => setForm((current) => ({ ...current, historical_period_id: event.target.value }))}>
            <option value="">Nessun periodo</option>
            {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
          </select>
        </label>
        <label>
          <span>Colore marker</span>
          <input type="color" value={form.marker_color} onChange={(event) => setForm((current) => ({ ...current, marker_color: event.target.value }))} />
        </label>
        <label>
          <span>Icona marker</span>
          <input value={form.marker_icon} placeholder="Opzionale" onChange={(event) => setForm((current) => ({ ...current, marker_icon: event.target.value }))} />
        </label>
        <label className="is-wide">
          <span>Descrizione breve</span>
          <textarea rows="3" value={form.short_description} onChange={(event) => setForm((current) => ({ ...current, short_description: event.target.value }))} />
        </label>
        <label className="is-wide">
          <span>Racconto esteso</span>
          <textarea rows="6" value={form.long_description} onChange={(event) => setForm((current) => ({ ...current, long_description: event.target.value }))} />
        </label>
      </div>
      <ImageUploader
        images={images}
        onAddFiles={(files) => {
          const { accepted, rejected } = validateImageFiles(files)
          if (rejected.length) setError(rejected.join(' · '))
          setImages((current) => [...current, ...accepted.map((file, index) => createFileDraft(file, !current.length && index === 0))])
        }}
        onMarkPrimary={(id) => setImages((current) => current.map((item) => ({ ...item, isPrimary: item.id === id })))}
        onRemoveImage={(id) => setImages((current) => current.filter((item) => item.id !== id))}
        disabled={saving}
      />
      <div className="place-image-url">
        <label>
          <span>Oppure aggiungi un’immagine da URL</span>
          <input type="url" value={imageUrl} placeholder="https://…" onChange={(event) => setImageUrl(event.target.value)} />
        </label>
        <button
          type="button"
          onClick={() => {
            try {
              const parsed = new URL(imageUrl)
              if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
              setImages((current) => [...current, createUrlDraft(imageUrl, !current.some((item) => item.isPrimary))])
              setImageUrl('')
              setError('')
            } catch {
              setError('Inserisci un URL immagine valido.')
            }
          }}
        >
          Aggiungi URL
        </button>
      </div>
      <button className="place-save-button" type="button" onClick={create} disabled={saving}>
        <Plus /> {saving ? 'Creazione…' : 'Crea livello storico'}
      </button>
    </div>
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
  const { canEdit } = useAuth()
  const [mode, setMode] = useState('view')
  const [editingLayer, setEditingLayer] = useState(activeLayer)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const layers = useMemo(
    () => [...(place?.place_historical_layers ?? [])].sort((a, b) => Number(a.start_year) - Number(b.start_year)),
    [place],
  )
  const gallery = useMemo(() => {
    const seen = new Set()
    return layers
      .flatMap((layer) => layer.place_images ?? [])
      .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)))
      .filter((image) => {
        const key = imageUrl(image)
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [layers])
  const tags = place?.place_tags?.map((entry) => entry.tags).filter(Boolean) ?? []

  if (!place) return null

  if (mode === 'edit' && editingLayer) {
    return (
      <aside className="place-panel is-editing">
        <PlaceEditor
          place={place}
          layer={editingLayer}
          periods={periods}
          onCancel={() => setMode('view')}
          onSaved={(updated) => {
            onPlaceUpdated(updated)
            const updatedLayer = updated.place_historical_layers?.find((layer) => layer.id === editingLayer.id)
            if (updatedLayer) onSelectLayer(updatedLayer)
            setMode('view')
          }}
        />
      </aside>
    )
  }

  if (mode === 'new-layer') {
    return (
      <aside className="place-panel is-editing">
        <NewLayerForm
          place={place}
          periods={periods}
          onCancel={() => setMode('view')}
          onCreated={(updated, layer) => {
            onPlaceUpdated(updated)
            onSelectLayer(layer)
            setMode('view')
          }}
        />
      </aside>
    )
  }

  return (
    <>
      <aside className="place-panel">
        <div className="place-panel-topbar">
          <span className="place-panel-kicker">Scheda luogo</span>
          <div>
            {canEdit && layers.length ? (
              <button
                type="button"
                onClick={() => {
                  setEditingLayer(activeLayer ?? layers[0])
                  setMode('edit')
                }}
                aria-label="Modifica luogo"
              >
                <Pencil />
              </button>
            ) : null}
            <button type="button" onClick={onClose} aria-label="Chiudi scheda">
              <X />
            </button>
          </div>
        </div>

        <div className="place-panel-scroll">
          <div className="place-panel-intro">
            <div className="place-panel-location"><MapPin /> Lecco e territorio</div>
            <h1>{place.canonical_name}</h1>
            {tags.length ? (
              <div className="place-tags">
                {tags.map((tag) => <span key={tag.id}>{tag.name}</span>)}
              </div>
            ) : null}
          </div>

          <Gallery images={gallery} placeName={place.canonical_name} onOpen={setLightboxIndex} />

          <div className="place-periods">
            {layers.map((layer) => {
              const podcasts = layer.place_podcast_episodes
                ?.map((entry) => entry.podcast_episodes)
                .filter(Boolean) ?? []
              const notes = layer.notes ?? []

              return (
                <section className="place-period" key={layer.id}>
                  <header className="place-period-heading">
                    <div>
                      <span className="place-panel-kicker">
                        {layer.historical_periods?.name || 'Periodo storico'}
                      </span>
                      <h2>{layer.title || layer.historical_periods?.name || 'Un’epoca del luogo'}</h2>
                    </div>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLayer(layer)
                          onSelectLayer(layer)
                          setMode('edit')
                        }}
                        aria-label={`Modifica ${layer.title || 'periodo storico'}`}
                      >
                        <Pencil />
                      </button>
                    ) : null}
                  </header>

                  <div className="place-facts">
                    <div>
                      <Clock3 />
                      <span>Periodo</span>
                      <strong>{layer.historical_periods?.name || 'Non indicato'}</strong>
                    </div>
                    <div>
                      <BookOpen />
                      <span>Cronologia</span>
                      <strong>{formatYear(layer.start_year)} — {formatYear(layer.end_year)}</strong>
                    </div>
                  </div>

                  {layer.short_description ? <p className="place-period-summary">{layer.short_description}</p> : null}

                  {layer.long_description ? (
                    <div className="place-story">
                      <p>{layer.long_description}</p>
                    </div>
                  ) : null}

                  {podcasts.length ? (
                    <div className="place-related">
                      <span className="place-panel-kicker"><Headphones /> Ascolta</span>
                      {podcasts.map((episode) => (
                        <article key={episode.id}>
                          <h3>{episode.title}</h3>
                          {episode.short_description ? <p>{episode.short_description}</p> : null}
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {notes.length ? (
                    <div className="place-related">
                      <span className="place-panel-kicker"><BookOpen /> Approfondisci</span>
                      {notes.map((note) => (
                        <article key={note.id}>
                          <h3>{note.title}</h3>
                          {note.content ? <p>{note.content}</p> : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>
              )
            })}
            {!layers.length ? (
              <div className="place-panel-empty">
                <BookOpen aria-hidden="true" />
                <span>Nessun periodo storico disponibile.</span>
              </div>
            ) : null}
          </div>

          {canEdit ? (
            <div className="place-admin-actions">
              <button type="button" onClick={onToggleVisited}>
                <Check /> {place.visited ? 'Segnato come visitato' : 'Segna come visitato'}
              </button>
              <button type="button" onClick={() => setMode('new-layer')}>
                <Plus /> Aggiungi livello storico
              </button>
              {layers.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingLayer(activeLayer ?? layers[0])
                    setMode('edit')
                  }}
                >
                  <Upload /> Gestisci dati e immagini
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>

      {lightboxIndex != null ? (
        <Lightbox
          images={gallery}
          index={lightboxIndex}
          placeName={place.canonical_name}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      ) : null}
    </>
  )
}

export default PlaceDrawer
