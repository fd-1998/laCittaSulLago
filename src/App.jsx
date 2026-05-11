import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import MobileMenu from './components/MobileMenu'
import AddPlace from './pages/AddPlace'
import HomeMap from './pages/HomeMap'
import NotesPage from './pages/NotesPage'
import PodcastsPage from './pages/PodcastsPage'
import PlaceDetail from './pages/PlaceDetail'
import TimelinePage from './pages/TimelinePage'

function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!isHome ? <Navbar variant="sticky" /> : null}

      {/* mobile menu mounted globally so all pages share the same mobile menu component */}
      <MobileMenu />

      <Routes>
        <Route path="/" element={<HomeMap />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/podcasts" element={<PodcastsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/add-location" element={<AddPlace />} />
        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App