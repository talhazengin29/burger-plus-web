import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import App from './App.jsx'
import { DilProvider } from './context/DilContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DilProvider><App /></DilProvider>
  </StrictMode>,
)
