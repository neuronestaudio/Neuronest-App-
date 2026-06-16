import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)

// Register the service worker so Neuronest is installable + works offline.
// Installed PWAs (esp. on iOS) cache aggressively, so also auto-reload once a
// new service worker takes control — this makes deploys actually reach the
// home-screen app instead of serving stale code.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !hadController) return // skip the first install
    reloading = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.update()) // check for a newer SW on every launch
      .catch(() => {
        /* SW optional — app still works without it */
      })
  })
}

