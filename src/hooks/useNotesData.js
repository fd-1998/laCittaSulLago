import { useCallback, useEffect, useState } from 'react'
import { fetchNoteGroups } from '../services/notes'

export default function useNotesData() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: supabaseError } = await fetchNoteGroups()
      if (supabaseError) {
        throw supabaseError
      }

      setGroups(data ?? [])
    } catch (loadError) {
      setError(loadError.message || 'Unable to load notes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await loadNotes()
    })()
  }, [loadNotes])

  return { groups, loading, error, reload: loadNotes }
}
