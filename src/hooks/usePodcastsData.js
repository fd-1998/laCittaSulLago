import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { fetchPodcastFeed } from '../lib/podcastFeed'

export default function usePodcastsData() {
  const [podcasts, setPodcasts] = useState([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [podcast, setPodcast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      setLoading(true)
      setError('')
      try {
        const series = await apiRequest('/podcasts', { signal: controller.signal })
        setPodcasts(series)
        setSelectedSlug((current) => current || series[0]?.slug || '')
        if (!series.length) {
          setPodcast(null)
          setLoading(false)
        }
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Impossibile caricare i podcast.')
          setLoading(false)
        }
      }
    })()
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    if (!selectedSlug) return undefined

    const controller = new AbortController()
    void (async () => {
      setLoading(true)
      setError('')
      try {
        const series = await apiRequest(`/podcasts/${encodeURIComponent(selectedSlug)}`, {
          signal: controller.signal,
        })
        const feed = await fetchPodcastFeed(series.feedUrl, controller.signal)
        const positions = new Map(series.episodeOrder.map((guid, index) => [guid, index]))
        const episodes = feed.episodes
          .map((episode, index) => ({ episode, index }))
          .sort((left, right) => {
            const leftPosition = positions.get(left.episode.id)
            const rightPosition = positions.get(right.episode.id)
            if (leftPosition == null && rightPosition == null) return left.index - right.index
            if (leftPosition == null) return 1
            if (rightPosition == null) return -1
            return leftPosition - rightPosition
          })
          .map(({ episode }) => episode)
        setPodcast({ ...series, episodes })
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Impossibile caricare gli episodi podcast.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [selectedSlug, reloadKey])

  return {
    podcasts,
    selectedSlug,
    selectPodcast: setSelectedSlug,
    podcast,
    episodes: podcast?.episodes ?? [],
    loading,
    error,
    reload,
  }
}
