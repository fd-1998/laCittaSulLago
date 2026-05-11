import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPlaceById } from '../services/places'

function PlaceDetail() {
  const { id } = useParams()
  const [place, setPlace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPlace() {
      setLoading(true)
      setError('')

      const { data, error: supabaseError } = await fetchPlaceById(id)

      if (!isMounted) {
        return
      }

      if (supabaseError) {
        setError(supabaseError.message)
        setLoading(false)
        return
      }

      setPlace(data)
      setLoading(false)
    }

    loadPlace()

    return () => {
      isMounted = false
    }
  }, [id])

  const primaryImage = useMemo(() => {
    if (!place) {
      return null
    }

    return place.place_images?.find((image) => image.is_primary) ?? place.place_images?.[0]
  }, [place])

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <section className="panel">
        <div className="panel-header flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              Place detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Single location view
            </h1>
          </div>
          <Link
            to="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Back to map
          </Link>
        </div>

        <div className="panel-body space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              Loading place…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {place ? (
            <article className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
                    {place.historical_periods?.name || 'Historical place'}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{place.title}</h2>
                </div>

                {primaryImage?.image_url ? (
                  <img
                    alt={primaryImage.caption || place.title}
                    className="h-56 w-full rounded-2xl object-cover"
                    src={primaryImage.image_url}
                  />
                ) : null}

                <p className="text-base leading-7 text-slate-300">{place.long_description}</p>

                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                >
                  Open in map
                </Link>
              </div>

              <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Coordinates</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {place.latitude}, {place.longitude}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Timeline</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {place.start_year} → {place.end_year}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Period label</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {place.historical_periods?.name}
                  </p>
                </div>
              </aside>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default PlaceDetail
