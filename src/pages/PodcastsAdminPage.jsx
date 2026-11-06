import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Edit3, Plus, Save } from 'lucide-react'
import { usePodcastFeed } from '../hooks/usePodcastsData'
import {
  createAdminPodcast,
  fetchAdminPodcasts,
  updateAdminEpisodeOrder,
  updateAdminPodcast,
} from '../services/podcastAdmin'

const emptyForm = {
  title: '',
  shortTitle: '',
  slug: '',
  description: '',
  feedUrl: '',
  spotifyUrl: '',
  image: '',
}

function showToForm(show) {
  return {
    title: show.title || '',
    shortTitle: show.shortTitle || '',
    slug: show.slug || '',
    description: show.description || '',
    feedUrl: show.feedUrl || '',
    spotifyUrl: show.spotifyUrl || '',
    image: show.image || '',
  }
}

function PodcastsAdminPage() {
  const [shows, setShows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const selectedShow = useMemo(
    () => shows.find((show) => show.id === selectedId),
    [selectedId, shows],
  )
  const { episodes, loading: episodesLoading, error: episodesError } = usePodcastFeed(form.feedUrl)
  const [orderedEpisodes, setOrderedEpisodes] = useState([])

  useEffect(() => {
    fetchAdminPodcasts()
      .then((items) => {
        setShows(items)
        if (items.length) {
          setSelectedId(items[0].id)
          setForm(showToForm(items[0]))
        } else {
          setIsNew(true)
        }
      })
      .catch((requestError) => {
        setError(requestError.message)
      })
  }, [])

  useEffect(() => {
    const savedOrder = selectedShow?.episodeOrder || []
    const positions = new Map(savedOrder.map((id, index) => [id, index]))
    setOrderedEpisodes(
      [...episodes].sort((a, b) => {
        const aPosition = positions.get(a.id)
        const bPosition = positions.get(b.id)
        if (aPosition != null || bPosition != null) {
          return (aPosition ?? Number.MAX_SAFE_INTEGER) - (bPosition ?? Number.MAX_SAFE_INTEGER)
        }
        return (Number(b.number) || 0) - (Number(a.number) || 0)
      }),
    )
  }, [episodes, selectedShow])

  function selectShow(show) {
    setSelectedId(show.id)
    setForm(showToForm(show))
    setIsNew(false)
    setError('')
    setMessage('')
  }

  function startNew() {
    setSelectedId(null)
    setForm(emptyForm)
    setIsNew(true)
    setError('')
    setMessage('')
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function savePodcast(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        ...form,
        spotifyUrl: form.spotifyUrl || null,
      }
      const saved = isNew
        ? await createAdminPodcast(payload)
        : await updateAdminPodcast(selectedShow.id, payload)
      const nextShows = isNew
        ? [...shows, saved]
        : shows.map((show) => (show.id === selectedId ? saved : show))
      setShows(nextShows)
      setSelectedId(saved.id)
      setForm(showToForm(saved))
      setIsNew(false)
      setMessage('Podcast salvato.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  function moveEpisode(index, direction) {
    const target = index + direction
    if (target < 0 || target >= orderedEpisodes.length) {
      return
    }

    setOrderedEpisodes((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function saveOrder() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const episodeOrder = orderedEpisodes.map((episode) => episode.id)
      await updateAdminEpisodeOrder(selectedShow.id, episodeOrder)
      setShows((current) => current.map((show) => (
        show.id === selectedShow.id ? { ...show, episodeOrder } : show
      )))
      setMessage('Ordine degli episodi salvato.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="podcast-admin-page">
      <header className="podcast-admin-heading">
        <div>
          <p className="app-kicker">Area amministrativa</p>
          <h1>Gestisci i podcast</h1>
          <p>Aggiungi una serie, aggiorna il feed e scegli l’ordine esatto degli episodi.</p>
        </div>
        <button type="button" className="app-primary-button" onClick={startNew}>
          <Plus aria-hidden="true" /> Nuovo podcast
        </button>
      </header>

      {error ? <div className="app-message app-message-error" role="alert">{error}</div> : null}
      {message ? <div className="podcast-admin-success" role="status"><Check aria-hidden="true" /> {message}</div> : null}

      <div className="podcast-admin-layout">
        <aside className="podcast-admin-list">
          <p className="app-kicker">Serie pubblicate</p>
          {shows.map((show) => (
            <button
              key={show.id}
              type="button"
              className={show.id === selectedId ? 'is-active' : ''}
              onClick={() => selectShow(show)}
            >
              <img src={show.image} alt="" />
              <span>{show.shortTitle || show.title}</span>
              <Edit3 aria-hidden="true" />
            </button>
          ))}
        </aside>

        <div className="podcast-admin-content">
          <form className="podcast-admin-form" onSubmit={savePodcast}>
            <div className="podcast-admin-section-heading">
              <div>
                <p className="app-kicker">{isNew ? 'Nuova serie' : 'Informazioni'}</p>
                <h2>{isNew ? 'Crea un podcast' : 'Modifica il podcast'}</h2>
              </div>
            </div>
            <div className="podcast-admin-fields">
              <label>
                Titolo
                <input name="title" value={form.title} onChange={updateField} required />
              </label>
              <label>
                Titolo breve
                <input name="shortTitle" value={form.shortTitle} onChange={updateField} required />
              </label>
              <label>
                Slug URL
                <input name="slug" value={form.slug} onChange={updateField} required />
              </label>
              <label>
                Feed RSS
                <input name="feedUrl" type="url" value={form.feedUrl} onChange={updateField} required />
              </label>
              <label className="is-wide">
                Descrizione
                <textarea name="description" rows="4" value={form.description} onChange={updateField} required />
              </label>
              <label>
                Link Spotify
                <input name="spotifyUrl" type="url" value={form.spotifyUrl} onChange={updateField} />
              </label>
              <label>
                Immagine di copertina
                <input name="image" type="url" value={form.image} onChange={updateField} required />
              </label>
            </div>
            <button className="app-primary-button" disabled={saving}>
              <Save aria-hidden="true" /> {saving ? 'Salvataggio…' : 'Salva podcast'}
            </button>
          </form>

          {!isNew && form.feedUrl ? (
            <section className="podcast-order-panel">
              <div className="podcast-admin-section-heading">
                <div>
                  <p className="app-kicker">Ordine di ascolto</p>
                  <h2>Riordina gli episodi</h2>
                  <p>Usa le frecce: il primo elemento sarà mostrato per primo nella pagina.</p>
                </div>
                <button type="button" className="podcast-order-save" disabled={saving} onClick={saveOrder}>
                  <Save aria-hidden="true" /> Salva ordine
                </button>
              </div>

              {episodesError ? <div className="app-message app-message-error">{episodesError}</div> : null}
              {episodesLoading ? <p>Caricamento del feed…</p> : null}
              <ol className="podcast-order-list">
                {orderedEpisodes.map((episode, index) => (
                  <li key={episode.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{episode.title}</strong>
                      <small>{episode.number ? `Episodio ${episode.number}` : 'Contenuto extra'}</small>
                    </div>
                    <button type="button" disabled={index === 0} aria-label={`Sposta in alto ${episode.title}`} onClick={() => moveEpisode(index, -1)}>
                      <ArrowUp aria-hidden="true" />
                    </button>
                    <button type="button" disabled={index === orderedEpisodes.length - 1} aria-label={`Sposta in basso ${episode.title}`} onClick={() => moveEpisode(index, 1)}>
                      <ArrowDown aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default PodcastsAdminPage
