import { apiRequest } from '../lib/api'

async function result(request) {
  try {
    return { data: await request, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function fetchPlaces() {
  return result(apiRequest('/places'))
}

export async function fetchPlaceById(id) {
  return result(apiRequest(`/places/${encodeURIComponent(id)}`))
}

export async function updatePlaceVisited(id, visited) {
  return result(apiRequest(`/places/${encodeURIComponent(id)}`, { method: 'PATCH', body: { visited } }))
}

export async function updatePlace(id, payload) {
  return result(apiRequest(`/places/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }))
}

export async function createPlace(payload) {
  return result(apiRequest('/places', { method: 'POST', body: payload }))
}

export async function createHistoricalLayer(payload) {
  return result(apiRequest('/historical-layers', { method: 'POST', body: payload }))
}

export async function updateHistoricalLayer(id, payload) {
  return result(apiRequest(`/historical-layers/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }))
}

export async function insertLayerImage(payload) {
  return result(apiRequest('/images', { method: 'POST', body: payload }))
}

export async function deleteLayerImages(layerId) {
  return result(apiRequest(`/historical-layers/${encodeURIComponent(layerId)}/images`, { method: 'DELETE' }))
}

export async function fetchHistoricalPeriods() {
  return result(apiRequest('/historical-periods'))
}

export async function createHistoricalPeriod(payload) {
  return result(apiRequest('/historical-periods', { method: 'POST', body: payload }))
}
