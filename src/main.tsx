import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    const toast = document.createElement('div')
    toast.id = 'pwa-toast'
    toast.innerHTML = `
      <span>새 버전이 있습니다!</span>
      <button id="pwa-update">업데이트</button>
      <button id="pwa-dismiss">✕</button>
    `
    document.body.appendChild(toast)
    document.getElementById('pwa-update')!.onclick = () => updateSW(true)
    document.getElementById('pwa-dismiss')!.onclick = () => toast.remove()
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
