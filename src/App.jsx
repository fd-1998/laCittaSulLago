import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import MobileMenu from './components/MobileMenu'
import AddPlace from './pages/AddPlace'
import HomeMap from './pages/HomeMap'
import NotesPage from './pages/NotesPage'
import PodcastsPage from './pages/PodcastsPage'
import PlaceDetail from './pages/PlaceDetail'
import TimelinePage from './pages/TimelinePage'
import DatabaseDump from './pages/DatabaseDump'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'
import AccountPage from './pages/AccountPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* {!isHome ? <Navbar variant="sticky" /> : null} */}
      <Navbar variant="sticky" />
      {/* mobile menu mounted globally so all pages share the same mobile menu component */}
      <MobileMenu />

      <Routes>
        <Route path="/" element={<HomeMap />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/podcasts" element={<PodcastsPage />} />
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