function ImagePreviewCard({ image, onMarkPrimary, onRemove, disabled }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-lg transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-cyan-500/5">
      <div className="relative aspect-[4/3] bg-slate-900">
        <img
          alt={image.file.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          src={image.previewUrl}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {image.isPrimary ? (
            <span className="rounded-full bg-cyan-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-lg shadow-cyan-500/20">
              Principale
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
              Galleria
            </span>
          )}

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-200 backdrop-blur transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={disabled}
            onClick={() => onRemove(image.id)}
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="truncate text-sm font-medium text-slate-100">{image.file.name}</p>
          {image.source === 'url' ? (
            <p className="mt-1 text-xs text-slate-400">Link esterno</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">{(image.file.size / (1024 * 1024)).toFixed(1)} MB</p>
          )}
        </div>

        <button
          className={`inline-flex w-full items-center justify-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
            image.isPrimary
              ? 'border border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
              : 'border border-slate-800 bg-slate-900/70 text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          type="button"
          disabled={disabled || image.isPrimary}
          onClick={() => onMarkPrimary(image.id)}
        >
          {image.isPrimary ? 'Immagine principale' : 'Imposta come principale'}
        </button>
      </div>
    </article>
  )
}

export default ImagePreviewCard