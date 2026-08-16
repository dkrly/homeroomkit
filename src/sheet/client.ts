import { useEffect, useState } from 'react'
import { parseTabs, type RawTabs, type SheetConfig } from './config'

const URL_KEY = 'homeroomkit-sheet-url'
const CACHE_KEY = 'homeroomkit-sheet-cache'

interface Cache {
  url: string
  fetchedAt: number
  tabs: RawTabs
}

export interface SheetState {
  /** 연결된 웹 앱 URL. 없으면 최초 설정 화면을 띄운다 */
  url: string | null
  config: SheetConfig | null
  /** 마지막으로 시트에서 읽어온 시각 */
  fetchedAt: number | null
  loading: boolean
  /** 마지막 동기화 실패 사유. 캐시가 있으면 앱은 그대로 동작한다 */
  error: string | null
}

// ── 저장소 ────────────────────────────────────────────────────────────────

export function getSheetUrl(): string | null {
  return localStorage.getItem(URL_KEY)
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
    // 용량 초과 등은 무시 — 다음 실행 때 다시 받아오면 된다
  }
}

// ── 네트워크 ──────────────────────────────────────────────────────────────

/** Apps Script 웹 앱 URL 인지 대략 확인 (로컬 개발용 주소도 허용) */
export function looksLikeWebAppUrl(url: string): boolean {
  const v = url.trim()
  return /^https:\/\/script\.google(usercontent)?\.com\/.+/.test(v)
    || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(v)
}

export async function fetchTabs(url: string): Promise<RawTabs> {
  let resp: Response
  try {
    resp = await fetch(url, { redirect: 'follow' })
  } catch {
    throw new Error('시트에 연결할 수 없습니다. 인터넷 연결과 URL을 확인하세요.')
  }
  if (!resp.ok) {
    throw new Error(`시트 응답 오류 (${resp.status}). 배포 설정에서 액세스 권한이 '모든 사용자'인지 확인하세요.`)
  }

  const text = await resp.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    // 로그인 페이지 HTML 등이 돌아온 경우
    throw new Error("시트 대신 다른 응답이 왔습니다. 배포 시 액세스 권한을 '모든 사용자'로 설정했는지 확인하세요.")
  }

  const body = json as { ok?: boolean; tabs?: RawTabs; error?: string }
  if (!body?.ok || !body.tabs) {
    throw new Error(body?.error ?? '시트에서 올바른 응답을 받지 못했습니다.')
  }
  return body.tabs
}

/** URL 을 검증하고 저장한다. 실패하면 저장하지 않고 throw */
export async function connectSheet(rawUrl: string): Promise<void> {
  const url = rawUrl.trim()
  const tabs = await fetchTabs(url)
  const config = parseTabs(tabs) // 파싱 단계에서 터지면 연결하지 않는다
  const fetchedAt = Date.now()
  localStorage.setItem(URL_KEY, url)
  writeCache({ url, fetchedAt, tabs })
  setState({ url, config, fetchedAt, loading: false, error: null })
}

export function disconnectSheet() {
  localStorage.removeItem(URL_KEY)
  localStorage.removeItem(CACHE_KEY)
  setState({ url: null, config: null, fetchedAt: null, loading: false, error: null })
}

// ── 상태 관리 ─────────────────────────────────────────────────────────────

function initialState(): SheetState {
  const url = getSheetUrl()
  const cache = url ? readCache() : null
  const usable = cache && cache.url === url ? cache : null
  return {
    url,
    config: usable ? parseTabs(usable.tabs) : null,
    fetchedAt: usable?.fetchedAt ?? null,
    loading: false,
    error: null,
  }
}

let state: SheetState = initialState()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(fn => fn())
}

function setState(partial: Partial<SheetState>) {
  state = { ...state, ...partial }
  notify()
}

/** 시트에서 다시 읽어온다. 실패해도 기존 캐시는 유지된다 */
export async function refreshSheet(): Promise<void> {
  const url = state.url ?? getSheetUrl()
  if (!url) return
  setState({ loading: true, error: null })
  try {
    const tabs = await fetchTabs(url)
    const config = parseTabs(tabs)
    const fetchedAt = Date.now()
    writeCache({ url, fetchedAt, tabs })
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
    if (state.url) void refreshSheet()
  }, [])

  return state
}
