import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import App from './App.jsx'
import { DilSaglayici } from './dil/DilContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DilSaglayici><App /></DilSaglayici>
  </StrictMode>,
)
