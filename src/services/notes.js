import { supabase } from '../lib/supabase'

export async function fetchNoteGroups() {
  return supabase
    .from('note_groups')
    .select(
      'id, name, notes ( id, title, subtitle, content, note_group_id, historical_layer_id, date_reference, created_at, place_historical_layers ( id, title, place_id ) )',
    )
    .order('name', { ascending: true })
}
