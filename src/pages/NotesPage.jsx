import { useState } from 'react'
import useNotesData from '../hooks/useNotesData'

function NotesPage() {
  const { groups, loading, error } = useNotesData()
  const [openGroupId, setOpenGroupId] = useState(null)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel">
        <div className="panel-header">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Archivio di ricerca
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Note, fonti e cronache
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Esplora note curate, raggruppate per tema, e sfoglia le voci in ordine cronologico.
          </p>
        </div>

        <div className="panel-body space-y-5">
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              Loading notes…
            </div>
          ) : null}

          <div className="space-y-4">
            {groups.map((group) => {
              const notes = (group.notes ?? []).slice().sort((a, b) => {
                const aDate = a.date_reference ? new Date(a.date_reference).getTime() : 0
                const bDate = b.date_reference ? new Date(b.date_reference).getTime() : 0
                return aDate - bDate
              })

              const isOpen = openGroupId === group.id

              return (
                <section key={group.id} className="rounded-2xl border border-slate-800 bg-slate-950/70">
                  <button
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    type="button"
                    onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                  >
                    <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Gruppo</p>
                      <h2 className="mt-1 text-lg font-semibold text-white">{group.name}</h2>
                      <p className="mt-1 text-xs text-slate-400">{notes.length} note</p>
                    </div>
                    <span className="text-xs text-slate-400">{isOpen ? 'Comprimi' : 'Espandi'}</span>
                  </button>

                  {isOpen ? (
                    <div className="space-y-4 border-t border-slate-800/80 px-5 py-5">
                      {notes.map((note) => (
                        <article
                          key={note.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {note.date_reference || 'Senza data'}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-white">{note.title}</h3>
                          {note.subtitle ? (
                            <p className="mt-1 text-sm text-cyan-200">{note.subtitle}</p>
                          ) : null}
                          <p className="mt-3 text-sm leading-6 text-slate-300">{note.content}</p>
                        </article>
                      ))}

                      {notes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
                            Nessuna nota in questo gruppo.
                          </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              )
            })}

            {!loading && groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
                Nessun gruppo di note disponibile.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

export default NotesPage
