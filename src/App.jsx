import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import AddPlace from './pages/AddPlace'
import HomeMap from './pages/HomeMap'
import PlaceDetail from './pages/PlaceDetail'
import TimelinePage from './pages/TimelinePage'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomeMap />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/add" element={<AddPlace />} />
        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App