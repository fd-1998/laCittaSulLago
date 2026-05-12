import usePodcastsData from '../hooks/usePodcastsData'

function PodcastsPage() {
  const { episodes, loading, error } = usePodcastsData()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel">
        <div className="panel-header">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Archivio podcast
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Storie oltre la mappa
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Esplora narrazioni audio legate al paesaggio di Lecco. Integrazioni con Spotify e YouTube pronte per futuri sviluppi.
          </p>
        </div>

        <div className="panel-body">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              Caricamento episodi podcast…
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {episodes.map((episode) => (
              <article
                key={episode.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-black/10"
              >
                {episode.cover_image ? (
                  <img
                    alt={episode.title}
                    className="mb-4 h-40 w-full rounded-2xl object-cover"
                    src={episode.cover_image}
                  />
                ) : null}
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Episodio</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{episode.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{episode.short_description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {episode.spotify_url ? (
                    <a
                      className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/10"
                      href={episode.spotify_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Spotify
                    </a>
                  ) : null}
                  {episode.youtube_url ? (
                    <a
                      className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/10"
                      href={episode.youtube_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      YouTube
                    </a>
                  ) : null}
                </div>
              </article>
            ))}

            {!loading && episodes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                Nessun episodio podcast disponibile.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

export default PodcastsPage
