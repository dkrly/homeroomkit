import { toPng } from 'html-to-image'

export interface DownloadJob {
  id: number
  label: string
  progress: number
  phase: 'queued' | 'capturing' | 'done' | 'error'
}

type Listener = () => void

let nextId = 0
const jobs: DownloadJob[] = []
const listeners = new Set<Listener>()
let processing = false

function notify() {
  listeners.forEach(fn => fn())
}

export function getJobs(): DownloadJob[] {
  return jobs
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function enqueue(sourceEl: HTMLElement, label: string) {
  const id = nextId++

  // DOM 복제 + 숨겨진 영역에 부착
  const clone = sourceEl.cloneNode(true) as HTMLElement
  clone.setAttribute('data-job-id', String(id))
  clone.style.position = 'fixed'
  clone.style.left = '-99999px'
  clone.style.top = '0'
  clone.style.zIndex = '-1'
  clone.style.pointerEvents = 'none'
  document.body.appendChild(clone)

  jobs.push({ id, label, progress: 0, phase: 'queued' })
  notify()
  processNext()
}

async function processNext() {
  if (processing) return
  const job = jobs.find(j => j.phase === 'queued')
  if (!job) return

  processing = true
  job.phase = 'capturing'
  notify()

  // 프로그레스 애니메이션
  const start = Date.now()
  const tick = () => {
    if (job.phase !== 'capturing') return
    const elapsed = Date.now() - start
    job.progress = Math.min(95, (elapsed / 100) ** 0.5 * 10)
    notify()
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)

  const clone = document.querySelector(`[data-job-id="${job.id}"]`) as HTMLElement | null
  if (!clone) {
    job.phase = 'error'
    processing = false
    notify()
    processNext()
    return
  }

  try {
    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      backgroundColor: '#F6F7F2',
    })

    job.progress = 100
    job.phase = 'done'
    notify()

    // 다운로드
    const link = document.createElement('a')
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    link.download = `homeroomkit_${job.label}_${ts}.png`
    link.href = dataUrl
    link.click()

    // 3초 후 job 제거
    setTimeout(() => {
      const idx = jobs.indexOf(job)
      if (idx >= 0) jobs.splice(idx, 1)
      notify()
    }, 3000)
  } catch {
    job.phase = 'error'
    notify()
    setTimeout(() => {
      const idx = jobs.indexOf(job)
      if (idx >= 0) jobs.splice(idx, 1)
      notify()
    }, 3000)
  } finally {
    clone.remove()
    processing = false
    processNext()
  }
}
