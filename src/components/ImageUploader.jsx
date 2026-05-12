import { useMemo, useRef, useState } from 'react'
import ImagePreviewCard from './ImagePreviewCard'

function ImageUploader({ images, onAddFiles, onMarkPrimary, onRemoveImage, disabled }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const hasImages = images.length > 0

  const primaryCount = useMemo(() => images.filter((image) => image.isPrimary).length, [images])

  function openFilePicker() {
    if (disabled) {
      return
    }

    inputRef.current?.click()
  }

  function handleFilesSelected(event) {
    onAddFiles?.(event.target.files)
    event.target.value = ''
  }

  function handleDragOver(event) {
    event.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) {
      return
    }

    onAddFiles?.(event.dataTransfer.files)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-200">Immagini</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Trascina una o più immagini, oppure sfoglia i file. La prima immagine selezionata può essere impostata come principale.
          </p>
        </div>
        <p className="hidden text-xs text-slate-500 sm:block">
          {primaryCount ? `${primaryCount} principale${primaryCount > 1 ? 'i' : ''}` : "Nessuna primaria selezionata"}
        </p>
      </div>

      <button
        type="button"
        onClick={openFilePicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled}
        className={`group flex w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-5 py-8 text-left transition sm:px-8 sm:py-10 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/10'
            : 'border-slate-800 bg-slate-950/70 hover:border-cyan-400/40 hover:bg-slate-900/80'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl text-cyan-300 transition group-hover:scale-105">
          ⤒
        </span>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-100 sm:text-base">
            Trascina le immagini qui o tocca per sfogliare
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
            PNG, JPG, WebP, GIF, AVIF. I file oltre 10 MB verranno ignorati.
          </p>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Aggiungi immagini
        </span>
      </button>

      <input
        ref={inputRef}
        accept="image/*"
        className="hidden"
        multiple
        type="file"
        onChange={handleFilesSelected}
      />

      {hasImages ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <ImagePreviewCard
              key={image.id}
              disabled={disabled}
              image={image}
              onMarkPrimary={onMarkPrimary}
              onRemove={onRemoveImage}
            />
          ))}
        </div>
      ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
          Nessuna immagine selezionata. Aggiungi un'immagine di copertina o crea una piccola galleria.
        </div>
      )}
    </section>
  )
}

export default ImageUploader