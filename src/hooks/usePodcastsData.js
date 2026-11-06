import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { fetchPodcastFeed } from '../lib/podcastFeed'

function sortEpisodes(episodes, episodeOrder) {
  const positions = new Map(episodeOrder.map((guid, index) => [guid, index]))

  return episodes
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
}

export function usePodcastCatalog() {
  const [podcasts, setPodcasts] = useState([])
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
        setPodcasts(await apiRequest('/podcasts', { signal: controller.signal }))
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Impossibile caricare i podcast.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [reloadKey])

  return { podcasts, loading, error, reload }
}

export function usePodcastFeed(feedUrl) {
  const [podcast, setPodcast] = useState(null)
  const [loading, setLoading] = useState(Boolean(feedUrl))
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    if (!feedUrl) {
      setPodcast(null)
      setLoading(false)
      setError('')
      return undefined
    }

    const controller = new AbortController()
    void (async () => {
      setLoading(true)
      setError('')
      try {
        setPodcast(await fetchPodcastFeed(feedUrl, controller.signal))
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Impossibile caricare gli episodi podcast.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [feedUrl, reloadKey])

  return { podcast, episodes: podcast?.episodes ?? [], loading, error, reload }
}

export default function usePodcastsData(slug) {
  const [podcast, setPodcast] = useState(null)
  const [loading, setLoading] = useState(Boolean(slug))
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    if (!slug) {
      setPodcast(null)
      setLoading(false)
      setError('')
      setNotFound(false)
      return undefined
    }

    const controller = new AbortController()
    void (async () => {
      setPodcast(null)
      setLoading(true)
      setError('')
      setNotFound(false)
      try {
        const series = await apiRequest(`/podcasts/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        })
        const feed = await fetchPodcastFeed(series.feedUrl, controller.signal)
        setPodcast({
          ...series,
          episodes: sortEpisodes(feed.episodes, series.episodeOrder),
        })
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setNotFound(loadError.status === 404)
          setError(loadError.message || 'Impossibile caricare gli episodi podcast.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [slug, reloadKey])

  return {
    podcast,
    episodes: podcast?.episodes ?? [],
    loading,
    error,
    notFound,
    reload,
  }
}
