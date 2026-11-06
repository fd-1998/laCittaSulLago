import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AddPlace from './pages/AddPlace'
import HomeMap from './pages/HomeMap'
import NotesPage from './pages/NotesPage'
import PodcastsPage, { PodcastsIndexPage } from './pages/PodcastsPage'
import PodcastsAdminPage from './pages/PodcastsAdminPage'
import PlaceDetail from './pages/PlaceDetail'
import TimelinePage from './pages/TimelinePage'
import DatabaseDump from './pages/DatabaseDump'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'
import AccountPage from './pages/AccountPage'
import ProtectedRoute from './components/ProtectedRoute'
import FrontPage from './frontpage/FrontPage'
import SiteHeader from './components/SiteHeader'
import { frontpageThemeVariables } from './frontpage/theme'

function App() {
  const location = useLocation()
  const isFrontPage = location.pathname === '/'

  return (
    <div
      className={isFrontPage ? 'min-h-screen' : 'app-shell min-h-screen'}
      style={frontpageThemeVariables}
    >
      <SiteHeader />

      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/mappa" element={<HomeMap />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/podcasts" element={<PodcastsIndexPage />} />
        <Route path="/podcasts/:podcastSlug" element={<PodcastsPage />} />
        <Route path="/admin/podcasts" element={<ProtectedRoute admin><PodcastsAdminPage /></ProtectedRoute>} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/database" element={<ProtectedRoute><DatabaseDump /></ProtectedRoute>} />
        <Route path="/add-location" element={<ProtectedRoute><AddPlace /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute admin><UsersPage /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App