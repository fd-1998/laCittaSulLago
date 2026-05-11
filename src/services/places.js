import { supabase } from '../lib/supabase'

const PLACE_SELECT = `
  id,
  title,
  short_description,
  long_description,
  latitude,
  longitude,
  start_year,
  end_year,
  period_id,
  visited,
  created_at,
  historical_periods ( id, name, start_year, end_year, color ),
  place_images ( id, image_url, thumbnail_url, caption, is_primary ),
  place_tags ( tags ( id, name ) ),
  place_podcast_episodes ( podcast_episodes ( id, title, short_description, spotify_url, youtube_url, cover_image, published_at ) )
`

export async function fetchPlaces() {
  return supabase.from('places').select(PLACE_SELECT).order('start_year', { ascending: true })
}

export async function fetchPlaceById(id) {
  return supabase.from('places').select(PLACE_SELECT).eq('id', id).single()
}

export async function updatePlaceVisited(id, visited) {
  return supabase.from('places').update({ visited }).eq('id', id).select(PLACE_SELECT).single()
}

export async function createPlace(payload) {
  return supabase.from('places').insert([payload]).select('id').single()
}

export async function insertPlaceImage(payload) {
  return supabase.from('place_images').insert([payload])
}

export async function fetchHistoricalPeriods() {
  return supabase.from('historical_periods').select('*').order('start_year', { ascending: true })
}

export async function createHistoricalPeriod(payload) {
  return supabase.from('historical_periods').insert([payload]).select('*').single()
}
