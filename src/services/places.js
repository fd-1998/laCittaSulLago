import { supabase } from '../lib/supabase'

const PLACE_SELECT = `
  id,
  canonical_name,
  latitude,
  longitude,
  visited,
  created_at,
  place_historical_layers (
    id,
    place_id,
    historical_period_id,
    title,
    short_description,
    long_description,
    start_year,
    end_year,
    marker_color,
    marker_icon,
    created_at,
    historical_periods ( id, name, start_year, end_year, color ),
    place_images ( id, image_url, thumbnail_url, caption, is_primary, historical_layer_id ),
    place_podcast_episodes ( podcast_episodes ( id, title, short_description, spotify_url, youtube_url, cover_image, published_at ) ),
    notes ( id, title, subtitle, content, date_reference, created_at )
  ),
  place_tags ( tags ( id, name ) )
`

export async function fetchPlaces() {
  return supabase
    .from('places')
    .select(PLACE_SELECT)
    .order('canonical_name', { ascending: true })
    .order('start_year', { ascending: true, foreignTable: 'place_historical_layers' })
}

export async function fetchPlaceById(id) {
  return supabase
    .from('places')
    .select(PLACE_SELECT)
    .eq('id', id)
    .order('start_year', { ascending: true, foreignTable: 'place_historical_layers' })
    .single()
}

export async function updatePlaceVisited(id, visited) {
  return supabase.from('places').update({ visited }).eq('id', id).select(PLACE_SELECT).single()
}

export async function updatePlace(id, payload) {
  return supabase.from('places').update(payload).eq('id', id).select('id').maybeSingle()
}

export async function createPlace(payload) {
  return supabase.from('places').insert([payload]).select('id').single()
}

export async function createHistoricalLayer(payload) {
  return supabase.from('place_historical_layers').insert([payload]).select('*').single()
}

export async function updateHistoricalLayer(id, payload) {
  return supabase.from('place_historical_layers').update(payload).eq('id', id).select('id').maybeSingle()
}

export async function insertLayerImage(payload) {
  const rows = Array.isArray(payload) ? payload : [payload]
  return supabase.from('place_images').insert(rows).select('*')
}

export async function deleteLayerImages(layerId) {
  return supabase.from('place_images').delete().eq('historical_layer_id', layerId)
}

export async function fetchHistoricalPeriods() {
  return supabase.from('historical_periods').select('*').order('start_year', { ascending: true })
}

export async function createHistoricalPeriod(payload) {
  return supabase.from('historical_periods').insert([payload]).select('*').single()
}
