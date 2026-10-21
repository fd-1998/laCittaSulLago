import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { TimelineProvider } from './context/TimelineContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TimelineProvider>
          <App />
        </TimelineProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
