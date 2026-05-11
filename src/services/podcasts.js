import { supabase } from '../lib/supabase'

export async function fetchPodcastEpisodes() {
  return supabase
    .from('podcast_episodes')
    .select('*')
    .order('published_at', { ascending: false })
}
