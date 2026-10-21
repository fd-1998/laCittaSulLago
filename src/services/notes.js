import { apiRequest } from '../lib/api'

export async function fetchNoteGroups() {
  try {
    return { data: await apiRequest('/note-groups'), error: null }
  } catch (error) {
    return { data: null, error }
  }
}
