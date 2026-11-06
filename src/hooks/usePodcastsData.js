import { useCallback, useEffect, useState } from 'react'
import { fetchPodcastFeed } from '../lib/podcastFeed'

export default function usePodcastsData(feedUrl) {
  const [podcast, setPodcast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEpisodes = useCallback(async (signal) => {
    setLoading(true)
    setError('')

    try {
      const feed = await fetchPodcastFeed(feedUrl, signal)
      setPodcast(feed)
    } catch (loadError) {
      if (loadError.name === 'AbortError') {
        return
      }
      setError(loadError.message || 'Impossibile caricare gli episodi podcast.')
    } finally {
      setLoading(false)
    }
  }, [feedUrl])

  useEffect(() => {
    if (!feedUrl) {
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    void (async () => {
      await loadEpisodes(controller.signal)
    })()
    return () => controller.abort()
  }, [loadEpisodes])

  return { podcast, episodes: podcast?.episodes ?? [], loading, error, reload: loadEpisodes }
}
