import {
  Menu,
  X,
  Filter,
  Layers,
  Search,
  Database,
  Home,
  Clock,
  Mic,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const iconBase = 'h-5 w-5 shrink-0'

function wrap(Icon) {
  return function WrappedIcon({ className = '', ...props }) {
    const merged = `${iconBase} ${className}`.trim()
    return <Icon className={merged} aria-hidden="true" {...props} />
  }
}

export const MenuIcon = wrap(Menu)
export const CloseIcon = wrap(X)
export const FilterIcon = wrap(Filter)
export const LayersIcon = wrap(Layers)
export const SearchIcon = wrap(Search)
export const DatabaseIcon = wrap(Database)
export const HomeIcon = wrap(Home)
export const TimelineIcon = wrap(Clock)
export const PodcastsIcon = wrap(Mic)
export const NotesIcon = wrap(FileText)
export const AddIcon = wrap(Plus)
export const ChevronLeftIcon = wrap(ChevronLeft)
export const ChevronRightIcon = wrap(ChevronRight)
