import { useEffect, useState } from 'react'
import { parseTabs, type RawTabs, type SheetConfig } from './config'
import { fetchTabs, parseSource, type Source } from './source'

const URL_KEY = 'homeroomkit-sheet-url'
const CACHE_KEY = 'homeroomkit-sheet-cache'

interface Cache {
  url: string
  fetchedAt: number
  tabs: RawTabs
}

export interface SheetState {
  /** 저장된 주소. 없으면 최초 연결 화면을 띄운다 */
  source: Source | null
  config: SheetConfig | null
  /** 마지막으로 읽어온 시각 */
  fetchedAt: number | null
  loading: boolean
  /** 마지막 동기화 실패 사유. 캐시가 있으면 앱은 그대로 동작한다 */
  error: string | null
}

// ── 저장소 ────────────────────────────────────────────────────────────────

function readStoredSource(): Source | null {
  const raw = localStorage.getItem(URL_KEY)
  return raw ? parseSource(raw) : null
}

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cache
    if (!parsed?.tabs || typeof parsed.tabs !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // 용량 초과 등은 무시 — 다음에 다시 받아오면 된다
  }
}

// ── 상태 ──────────────────────────────────────────────────────────────────

function initialState(): SheetState {
  const source = readStoredSource()
  const cache = source ? readCache() : null
  const usable = cache && cache.url === source?.url ? cache : null
  return {
    source,
    config: usable ? parseTabs(usable.tabs) : null,
    fetchedAt: usable?.fetchedAt ?? null,
    loading: false,
    error: null,
  }
}

let state: SheetState = initialState()
const listeners = new Set<() => void>()

function setState(partial: Partial<SheetState>) {
  state = { ...state, ...partial }
  listeners.forEach(fn => fn())
}

// ── 연결 / 해제 / 갱신 ────────────────────────────────────────────────────

/** 주소를 검증하고 저장한다. 실패하면 저장하지 않고 throw */
export async function connectSheet(rawUrl: string): Promise<void> {
  const source = parseSource(rawUrl)
  if (!source) {
    throw new Error('구글 시트 주소나 Apps Script 웹 앱 주소를 붙여넣어 주세요.')
  }
  const tabs = await fetchTabs(source)
  const config = parseTabs(tabs) // 파싱에서 터지면 연결하지 않는다
  if (config.students.length === 0 && config.semesters.length === 0) {
    throw new Error('시트를 읽었지만 내용이 비어 있습니다. 탭 이름과 초기 세팅을 확인하세요.')
  }
  const fetchedAt = Date.now()
  localStorage.setItem(URL_KEY, source.url)
  writeCache({ url: source.url, fetchedAt, tabs })
  setState({ source, config, fetchedAt, loading: false, error: null })
}

export function disconnectSheet() {
  localStorage.removeItem(URL_KEY)
  localStorage.removeItem(CACHE_KEY)
  setState({ source: null, config: null, fetchedAt: null, loading: false, error: null })
}

/** 다시 읽어온다. 실패해도 기존 캐시는 유지된다 */
export async function refreshSheet(): Promise<void> {
  const source = state.source
  if (!source) return
  setState({ loading: true, error: null })
  try {
    const tabs = await fetchTabs(source)
    const config = parseTabs(tabs)
    const fetchedAt = Date.now()
    writeCache({ url: source.url, fetchedAt, tabs })
    setState({ config, fetchedAt, loading: false, error: null })
  } catch (e) {
    setState({ loading: false, error: e instanceof Error ? e.message : '동기화 실패' })
  }
}

let booted = false

export function useSheet(): SheetState {
  const [, rerender] = useState(0)

  useEffect(() => {
    const fn = () => rerender(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  useEffect(() => {
    if (booted) return
    booted = true
    // 캐시로 먼저 그리고, 뒤에서 최신 내용을 받아온다
    if (state.source) void refreshSheet()
  }, [])

  return state
}
