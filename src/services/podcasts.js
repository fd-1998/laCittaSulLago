import { apiRequest } from '../lib/api'

export async function fetchPodcastEpisodes() {
  try {
    return { data: await apiRequest('/podcast-episodes'), error: null }
  } catch (error) {
    return { data: null, error }
  }
}
