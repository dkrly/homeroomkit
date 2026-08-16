import { TAB_NAMES, type RawTabs } from './config'

/**
 * 앱이 받아들이는 두 가지 주소.
 *  - script: Apps Script 웹 앱. 시트를 비공개로 둘 수 있다.
 *  - sheet : 구글 시트 주소를 그대로. 시트가 '링크가 있는 모든 사용자'로 공개돼 있어야 한다.
 */
export type Source =
  | { kind: 'script'; url: string; label: string }
  | { kind: 'sheet'; id: string; url: string; label: string }

const SCRIPT_RE = /^https:\/\/script\.google(usercontent)?\.com\/.+/
const LOCAL_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//
const SHEET_ID_RE = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]{20,})/

/** 붙여넣은 주소가 어느 방식인지 판별한다. 알아볼 수 없으면 null */
export function parseSource(raw: string): Source | null {
  const url = raw.trim()
  if (!url) return null

  if (SCRIPT_RE.test(url) || LOCAL_RE.test(url)) {
    return { kind: 'script', url, label: 'Apps Script 웹 앱' }
  }

  // 웹에 게시된 주소(/d/e/2PACX-...)는 탭 이름으로 읽을 수 없다
  if (/\/spreadsheets\/d\/e\//.test(url)) return null

  const m = SHEET_ID_RE.exec(url)
  if (m) return { kind: 'sheet', id: m[1], url, label: '구글 시트' }

  return null
}

// ── CSV ───────────────────────────────────────────────────────────────────

/** 따옴표 안의 쉼표·줄바꿈·이스케이프된 따옴표까지 처리하는 파서 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else quoted = false
      } else {
        field += c
      }
      continue
    }

    if (c === '"') { quoted = true }
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') { field += c }
  }

  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

// ── 가져오기 ──────────────────────────────────────────────────────────────

class SourceError extends Error {}

async function fetchFromScript(url: string): Promise<RawTabs> {
  let resp: Response
  try {
    resp = await fetch(url, { redirect: 'follow' })
  } catch {
    throw new SourceError('웹 앱에 연결할 수 없습니다. 인터넷 연결과 주소를 확인하세요.')
  }
  if (!resp.ok) {
    throw new SourceError(`웹 앱 응답 오류 (${resp.status}). 배포 설정에서 액세스 권한이 '모든 사용자'인지 확인하세요.`)
  }

  const text = await resp.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new SourceError("시트 대신 로그인 페이지가 돌아왔습니다. 배포 시 액세스 권한을 '모든 사용자'로 설정했는지 확인하세요.")
  }

  const body = json as { ok?: boolean; tabs?: RawTabs; error?: string }
  if (!body?.ok || !body.tabs) {
    throw new SourceError(body?.error ?? '웹 앱에서 올바른 응답을 받지 못했습니다.')
  }
  return body.tabs
}

function gvizUrl(id: string, tab: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
}

async function fetchFromSheet(id: string): Promise<RawTabs> {
  const results = await Promise.all(TAB_NAMES.map(async name => {
    try {
      const resp = await fetch(gvizUrl(id, name))
      if (!resp.ok) return { name, rows: [] as string[][], status: resp.status }
      const text = await resp.text()
      // 비공개 시트는 로그인 페이지 HTML 을 돌려준다
      if (text.trimStart().startsWith('<')) return { name, rows: [], status: 401 }
      return { name, rows: parseCsv(text), status: 200 }
    } catch {
      return { name, rows: [] as string[][], status: 0 }
    }
  }))

  if (results.every(r => r.status === 401 || r.status === 403)) {
    throw new SourceError(
      '시트가 비공개라 읽을 수 없습니다. 시트에서 공유 → 일반 액세스를 ' +
      "'링크가 있는 모든 사용자 · 뷰어' 로 바꾸거나, Apps Script 방식을 쓰세요."
    )
  }
  if (results.every(r => r.rows.length === 0)) {
    throw new SourceError('시트에서 내용을 읽지 못했습니다. 주소와 탭 이름을 확인하세요.')
  }

  const tabs: RawTabs = {}
  for (const r of results) tabs[r.name] = r.rows
  return tabs
}

export function fetchTabs(source: Source): Promise<RawTabs> {
  return source.kind === 'script' ? fetchFromScript(source.url) : fetchFromSheet(source.id)
}
