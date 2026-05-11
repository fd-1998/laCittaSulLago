const iconBase = 'h-5 w-5 shrink-0'

function SvgIcon({ children, className = '', viewBox = '0 0 24 24', ...props }) {
  return (
    <svg
      aria-hidden="true"
      className={`${iconBase} ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox={viewBox}
      {...props}
    >
      {children}
    </svg>
  )
}

export function MenuIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </SvgIcon>
  )
}

export function CloseIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </SvgIcon>
  )
}

export function FilterIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </SvgIcon>
  )
}

export function LayersIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4l8 4-8 4-8-4 8-4Z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </SvgIcon>
  )
}

export function SearchIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </SvgIcon>
  )
}

export function HomeIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
    </SvgIcon>
  )
}

export function TimelineIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M5 7v10" />
      <path d="M12 4v16" />
      <path d="M19 10v4" />
      <circle cx="5" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="10" r="1.5" fill="currentColor" stroke="none" />
    </SvgIcon>
  )
}

export function PodcastsIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 14a4 4 0 0 0 4-4V9a4 4 0 0 0-8 0v1a4 4 0 0 0 4 4Z" />
      <path d="M8 11v1a4 4 0 0 0 8 0v-1" />
      <path d="M12 15v5" />
      <path d="M9 20h6" />
    </SvgIcon>
  )
}

export function NotesIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M7 4h8l4 4v12H7z" />
      <path d="M15 4v4h4" />
      <path d="M9 11h6M9 15h6" />
    </SvgIcon>
  )
}

export function AddIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </SvgIcon>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M14 6l-6 6 6 6" />
    </SvgIcon>
  )
}

export function ChevronRightIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M10 6l6 6-6 6" />
    </SvgIcon>
  )
}
