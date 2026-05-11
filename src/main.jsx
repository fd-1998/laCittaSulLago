import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { TimelineProvider } from './context/TimelineContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <TimelineProvider>
        <App />
      </TimelineProvider>
    </BrowserRouter>
  </StrictMode>,
)
