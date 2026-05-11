function MobilePanel({ isOpen, title, children, onClose }) {
  return (
    <div
      className={`fixed inset-0 z-40 transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-slate-950/70 backdrop-blur transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        role="presentation"
      />
      <div
        className={`absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t border-slate-800 bg-slate-950/95 p-6 shadow-2xl transition-transform ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            {title}
          </p>
          <button
            className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="overflow-auto pb-6">{children}</div>
      </div>
    </div>
  )
}

export default MobilePanel
