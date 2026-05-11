import { supabase } from '../lib/supabase'

export async function fetchNoteGroups() {
  return supabase
    .from('note_groups')
    .select('id, name, notes ( id, title, subtitle, content, note_group_id, related_place_id, date_reference, created_at )')
    .order('name', { ascending: true })
}
