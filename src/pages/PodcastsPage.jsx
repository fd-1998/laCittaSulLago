import { CalendarDays, Clock3, ExternalLink, Headphones, Radio } from 'lucide-react'
import usePodcastsData from '../hooks/usePodcastsData'
import { siteContacts } from '../frontpage/siteConfig'

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function PodcastsPage() {
  const { podcast, episodes, loading, error } = usePodcastsData()

  return (
    <main className="podcast-page">
      <section className="podcast-page-hero">
        <div className="podcast-cover-wrap">
          {podcast?.image ? <img src={podcast.image} alt={`Copertina di ${podcast.title}`} /> : null}
          <span className="podcast-live-badge"><Radio aria-hidden="true" /> RSS live</span>
        </div>
        <div>
          <p className="app-kicker">Il nostro podcast</p>
          <h1>{podcast?.title || 'Lecco — La Città sul Lago'}</h1>
          <p className="podcast-intro">
            {podcast?.description || 'La storia di Lecco raccontata da chi la abita, episodio dopo episodio.'}
          </p>
          <a className="app-primary-button" href={siteContacts.spotify.href} target="_blank" rel="noreferrer">
            Segui su Spotify <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="podcast-archive" aria-labelledby="episodes-heading">
        <div className="podcast-archive-heading">
          <div>
            <p className="app-kicker">Dal feed RSS</p>
            <h2 id="episodes-heading">Tutti gli episodi</h2>
          </div>
          {!loading && !error ? <span>{episodes.length} episodi</span> : null}
        </div>

        {error ? (
          <div className="app-message app-message-error" role="alert">
            <strong>Non siamo riusciti a caricare il feed.</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="podcast-loading" role="status">
            <Headphones aria-hidden="true" />
            <span>Stiamo sintonizzando gli episodi…</span>
          </div>
        ) : null}

        <div className="episode-list">
          {episodes.map((episode, index) => (
            <article className="episode-card" key={episode.id}>
              <div className="episode-number">
                {episode.type === 'bonus' ? 'Extra' : episode.number ? `E${episode.number}` : String(index + 1).padStart(2, '0')}
              </div>
              <div className="episode-content">
                <div className="episode-meta">
                  <span><CalendarDays aria-hidden="true" /> {formatDate(episode.publishedAt)}</span>
                  {episode.duration ? <span><Clock3 aria-hidden="true" /> {episode.duration}</span> : null}
                </div>
                <h3>{episode.title}</h3>
                <p>{episode.shortDescription}</p>
                {episode.audioUrl ? (
                  <audio controls preload="none">
                    <source src={episode.audioUrl} type={episode.audioType} />
                    Il tuo browser non supporta la riproduzione audio.
                  </audio>
                ) : null}
              </div>
              {episode.link ? (
                <a
                  className="episode-external-link"
                  href={episode.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Apri ${episode.title} su Spotify`}
                >
                  <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default PodcastsPage
