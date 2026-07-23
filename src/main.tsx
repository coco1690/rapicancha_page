import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { registerPwa } from './pwa/registerPwa'
import { AppThemeProvider } from './theme/AppThemeProvider'
import './index.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element #root was not found')
}

registerPwa()

createRoot(root).render(
  <StrictMode>
    <AppThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppThemeProvider>
  </StrictMode>,
)
