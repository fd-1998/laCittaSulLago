import { apiRequest } from '../lib/api'

export function fetchAdminPodcasts() {
  return apiRequest('/admin/podcasts')
}

export function createAdminPodcast(payload) {
  return apiRequest('/admin/podcasts', { method: 'POST', body: payload })
}

export function updateAdminPodcast(id, payload) {
  return apiRequest(`/admin/podcasts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function updateAdminEpisodeOrder(id, episodeIds) {
  return apiRequest(`/admin/podcasts/${encodeURIComponent(id)}/episode-order`, {
    method: 'PUT',
    body: { episodeIds },
  })
}
