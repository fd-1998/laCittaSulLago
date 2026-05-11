import { useCallback, useEffect, useState } from 'react'
import { fetchPodcastEpisodes } from '../services/podcasts'

export default function usePodcastsData() {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEpisodes = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: supabaseError } = await fetchPodcastEpisodes()
      if (supabaseError) {
        throw supabaseError
      }

      setEpisodes(data ?? [])
    } catch (loadError) {
      setError(loadError.message || 'Unable to load podcast episodes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await loadEpisodes()
    })()
  }, [loadEpisodes])

  return { episodes, loading, error, reload: loadEpisodes }
}
