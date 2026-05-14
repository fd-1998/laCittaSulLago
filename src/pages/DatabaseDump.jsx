import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SearchIcon } from '../components/UiIcons'

const TABLES = [
  {
    name: 'places',
    label: 'Luoghi',
    description: 'Geografia stabile, coordinate e stato visita.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: ['id', 'canonical_name', 'latitude', 'longitude', 'visited', 'created_at'],
    order: { column: 'canonical_name', ascending: true },
  },
  {
    name: 'historical_periods',
    label: 'Periodi storici',
    description: 'Ere storiche e colori di riferimento.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: ['id', 'name', 'start_year', 'end_year', 'color', 'created_at'],
    order: { column: 'start_year', ascending: true },
  },
  {
    name: 'place_historical_layers',
    label: 'Layer storici dei luoghi',
    description: 'Identità narrative per luogo e periodo.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: [
      'id',
      'place_id',
      'historical_period_id',
      'title',
      'short_description',
      'long_description',
      'start_year',
      'end_year',
      'marker_color',
      'marker_icon',
      'created_at',
    ],
    order: { column: 'place_id', ascending: true },
  },
  {
    name: 'place_images',
    label: 'Immagini storiche',
    description: 'Media collegati ai layer storici.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: [
      'id',
      'place_id',
      'historical_layer_id',
      'image_url',
      'thumbnail_url',
      'caption',
      'is_primary',
      'created_at',
    ],
    order: { column: 'historical_layer_id', ascending: true },
  },
  {
    name: 'podcast_episodes',
    label: 'Podcast',
    description: 'Archivio degli episodi audio.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: [
      'id',
      'title',
      'short_description',
      'long_description',
      'spotify_url',
      'youtube_url',
      'cover_image',
      'published_at',
      'created_at',
    ],
    order: { column: 'published_at', ascending: false },
  },
  {
    name: 'place_podcast_episodes',
    label: 'Relazioni luogo/podcast',
    description: 'Connessioni tra layer e episodi.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: ['id', 'historical_layer_id', 'podcast_episode_id', 'created_at'],
    order: { column: 'historical_layer_id', ascending: true },
  },
  {
    name: 'note_groups',
    label: 'Gruppi note',
    description: 'Categorie per l’archivio di ricerca.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: ['id', 'name', 'created_at'],
    order: { column: 'name', ascending: true },
  },
  {
    name: 'notes',
    label: 'Note',
    description: 'Archivio di ricerca e contenuti.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: [
      'id',
      'title',
      'subtitle',
      'content',
      'note_group_id',
      'related_place_id',
      'historical_layer_id',
      'date_reference',
      'created_at',
    ],
    order: { column: 'date_reference', ascending: false },
  },
  {
    name: 'tags',
    label: 'Tag',
    description: 'Tassonomia e parole chiave.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: ['id', 'name', 'created_at'],
    order: { column: 'name', ascending: true },
  },
  {
    name: 'place_tags',
    label: 'Relazioni luogo/tag',
    description: 'Collegamenti tra luoghi e tag.',
    primaryKeys: ['id'],
    readOnly: ['id', 'created_at'],
    columns: ['id', 'place_id', 'tag_id', 'created_at'],
    order: { column: 'place_id', ascending: true },
  },
]

const BOOLEAN_FIELDS = new Set(['visited', 'is_primary'])
const COLOR_FIELDS = new Set(['color', 'marker_color'])
const TEXTAREA_FIELDS = new Set([
  'short_description',
  'long_description',
  'content',
  'caption',
  'subtitle',
])
const NUMBER_FIELDS = new Set([
  'latitude',
  'longitude',
  'start_year',
  'end_year',
  'place_id',
  'historical_period_id',
  'historical_layer_id',
  'note_group_id',
  'related_place_id',
  'tag_id',
  'podcast_episode_id',
])

const formatValue = (value) => {
  if (value == null) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

const buildRowKey = (table, row) => table.primaryKeys.map((key) => formatValue(row[key])).join('::')

function DatabaseDump() {
  const [dataByTable, setDataByTable] = useState({})
  const [loadingByTable, setLoadingByTable] = useState({})
  const [errorByTable, setErrorByTable] = useState({})
  const [dirtyRows, setDirtyRows] = useState({})
  const [savingRows, setSavingRows] = useState({})
  const [statusRows, setStatusRows] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTable = useCallback(async (table) => {
    setLoadingByTable((prev) => ({ ...prev, [table.name]: true }))
    setErrorByTable((prev) => ({ ...prev, [table.name]: null }))

    let query = supabase.from(table.name).select('*')
    if (table.order?.column) {
      query = query.order(table.order.column, { ascending: table.order.ascending })
    }

    const { data, error } = await query

    if (error) {
      setErrorByTable((prev) => ({ ...prev, [table.name]: error.message }))
      setDataByTable((prev) => ({ ...prev, [table.name]: [] }))
    } else {
      setDataByTable((prev) => ({ ...prev, [table.name]: data ?? [] }))
    }

    setLoadingByTable((prev) => ({ ...prev, [table.name]: false }))
  }, [])

  useEffect(() => {
    TABLES.forEach((table) => {
      fetchTable(table)
    })
  }, [fetchTable])

  const handleChange = useCallback((table, rowKey, field, value) => {
    setDataByTable((prev) => {
      const rows = prev[table.name] ?? []
      const updated = rows.map((row) =>
        buildRowKey(table, row) === rowKey ? { ...row, [field]: value } : row,
      )
      return { ...prev, [table.name]: updated }
    })

    setDirtyRows((prev) => ({
      ...prev,
      [table.name]: { ...prev[table.name], [rowKey]: true },
    }))

    setStatusRows((prev) => ({
      ...prev,
      [table.name]: { ...prev[table.name], [rowKey]: null },
    }))
  }, [])

  const buildPayload = useCallback((table, row) => {
    const payload = {}
    table.columns.forEach((field) => {
      if (table.readOnly.includes(field) || table.primaryKeys.includes(field)) {
        return
      }
      let value = row[field]
      if (NUMBER_FIELDS.has(field)) {
        value = value === '' ? null : Number(value)
        if (Number.isNaN(value)) {
          value = null
        }
      }
      payload[field] = value
    })
    return payload
  }, [])

  const saveRow = useCallback(
    async (table, row) => {
      const rowKey = buildRowKey(table, row)
      const match = table.primaryKeys.reduce((acc, key) => {
        acc[key] = row[key]
        return acc
      }, {})

      setSavingRows((prev) => ({
        ...prev,
        [table.name]: { ...prev[table.name], [rowKey]: true },
      }))

      const payload = buildPayload(table, row)
      const { data, error } = await supabase.from(table.name).update(payload).match(match).select('*')

      if (error) {
        setStatusRows((prev) => ({
          ...prev,
          [table.name]: { ...prev[table.name], [rowKey]: error.message },
        }))
      } else {
        const updatedRow = Array.isArray(data) ? data[0] : data
        setDataByTable((prev) => {
          const rows = prev[table.name] ?? []
          const nextRows = rows.map((item) =>
            buildRowKey(table, item) === rowKey ? { ...item, ...updatedRow } : item,
          )
          return { ...prev, [table.name]: nextRows }
        })

        setDirtyRows((prev) => ({
          ...prev,
          [table.name]: { ...prev[table.name], [rowKey]: false },
        }))
        setStatusRows((prev) => ({
          ...prev,
          [table.name]: { ...prev[table.name], [rowKey]: 'Salvato' },
        }))
      }

      setSavingRows((prev) => ({
        ...prev,
        [table.name]: { ...prev[table.name], [rowKey]: false },
      }))
    },
    [buildPayload],
  )

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredData = useMemo(() => {
    if (!normalizedSearch) {
      return dataByTable
    }

    const matches = {}
    TABLES.forEach((table) => {
      const rows = dataByTable[table.name] ?? []
      matches[table.name] = rows.filter((row) =>
        Object.values(row).some((value) =>
          formatValue(value).toLowerCase().includes(normalizedSearch),
        ),
      )
    })
    return matches
  }, [dataByTable, normalizedSearch])

  const renderField = (table, row, field) => {
    const value = row[field]
    const rowKey = buildRowKey(table, row)
    const isReadOnly = table.readOnly.includes(field)
    const inputClasses =
      'w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/30'

    if (BOOLEAN_FIELDS.has(field)) {
      return (
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={isReadOnly}
            onChange={(event) => handleChange(table, rowKey, field, event.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
          />
          {value ? 'Sì' : 'No'}
        </label>
      )
    }

    if (COLOR_FIELDS.has(field)) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || '#0ea5e9'}
            disabled={isReadOnly}
            onChange={(event) => handleChange(table, rowKey, field, event.target.value)}
            className="h-9 w-10 rounded-lg border border-slate-800 bg-slate-900"
          />
          <input
            type="text"
            value={formatValue(value)}
            disabled={isReadOnly}
            onChange={(event) => handleChange(table, rowKey, field, event.target.value)}
            className={inputClasses}
          />
        </div>
      )
    }

    if (TEXTAREA_FIELDS.has(field)) {
      return (
        <textarea
          rows={3}
          value={formatValue(value)}
          disabled={isReadOnly}
          onChange={(event) => handleChange(table, rowKey, field, event.target.value)}
          className={`${inputClasses} min-w-[18rem]`}
        />
      )
    }

    if (NUMBER_FIELDS.has(field)) {
      return (
        <input
          type="number"
          value={value ?? ''}
          disabled={isReadOnly}
          onChange={(event) => handleChange(table, rowKey, field, event.target.value)}
          className={inputClasses}
        />
      )
    }

    return (
      <input
        type="text"
        value={formatValue(value)}
        disabled={isReadOnly}
        onChange={(event) => handleChange(table, rowKey, field, event.target.value)}
        className={inputClasses}
      />
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel">
        <div className="panel-header">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Archivio operativo
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Dump & modifica database
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Esplora tutte le tabelle del database storico e aggiorna le voci direttamente dalla
            piattaforma.
          </p>
        </div>
        <div className="panel-body">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <SearchIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Ricerca globale</p>
                <p className="text-xs text-slate-400">Filtra tutte le tabelle con una sola query.</p>
              </div>
            </div>
            <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <SearchIcon className="h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cerca per titolo, luogo, periodo, tag..."
                className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-6">
        {TABLES.map((table) => {
          const rows = filteredData[table.name] ?? []
          const rawRows = dataByTable[table.name] ?? []
          const isLoading = loadingByTable[table.name]
          const error = errorByTable[table.name]

          return (
            <section key={table.name} className="panel">
              <div className="panel-header flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                    {table.label}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{table.description}</h2>
                  <p className="mt-2 text-xs text-slate-400">
                    {normalizedSearch
                      ? `Mostrati ${rows.length} risultati su ${rawRows.length}`
                      : `Totale voci: ${rawRows.length}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchTable(table)}
                  className="rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40"
                >
                  Ricarica
                </button>
              </div>
              <div className="panel-body">
                {error ? (
                  <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}

                {isLoading ? (
                  <p className="text-sm text-slate-400">Caricamento dati...</p>
                ) : null}

                {!isLoading && rows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
                    Nessun dato disponibile per questa tabella.
                  </div>
                ) : null}

                {!isLoading && rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                          {table.columns.map((field) => (
                            <th key={field} className="px-3 py-2">
                              {field.replace(/_/g, ' ')}
                            </th>
                          ))}
                          <th className="px-3 py-2">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const rowKey = buildRowKey(table, row)
                          const isDirty = Boolean(dirtyRows[table.name]?.[rowKey])
                          const isSaving = Boolean(savingRows[table.name]?.[rowKey])
                          const status = statusRows[table.name]?.[rowKey]

                          return (
                            <tr key={rowKey} className="rounded-2xl bg-slate-950/70 text-xs text-slate-200">
                              {table.columns.map((field) => (
                                <td key={field} className="px-3 py-3 align-top">
                                  {renderField(table, row, field)}
                                </td>
                              ))}
                              <td className="px-3 py-3 align-top">
                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveRow(table, row)}
                                    disabled={!isDirty || isSaving}
                                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                      isDirty
                                        ? 'border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/10'
                                        : 'border-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {isSaving ? 'Salvataggio...' : 'Salva'}
                                  </button>
                                  {status ? (
                                    <span className="text-[11px] text-slate-400">{status}</span>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>
      </main>
    )
}

export default DatabaseDump
