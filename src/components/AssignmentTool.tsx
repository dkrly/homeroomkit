import { useState, useRef, useCallback, type DragEvent } from 'react'
import * as XLSX from 'xlsx'

// --- types ---
interface FileSlot {
  name: string
  data: ArrayBuffer
}
type SlotKey = 'student' | 'activity' | 'apply'

interface LogEntry { t: 'info' | 'warn' | 'err'; m: string }
interface MapEntry { raw: string; mt: string; code: string | null; name: string | null }
interface Stats { total: number; matched: number; noApply: number; unmatched: number }

const SLOTS: { key: SlotKey; icon: string; label: string; hint: string }[] = [
  { key: 'student', icon: '👥', label: '학생목록', hint: '*학생목록.xlsx' },
  { key: 'activity', icon: '📚', label: '활동목록', hint: '*활동목록*.xlsx' },
  { key: 'apply', icon: '📋', label: '신청자목록', hint: '자유학기제_신청자목록*.xlsx' },
]

const S_COLS = ['학년도','학기코드','학기명','과정코드','과정명','학년','반코드','번호','학생개인번호','성명']
const A_COLS = ['영역코드','영역명','활동코드','활동명']

// --- helpers ---
function norm(s: unknown) { return s == null ? '' : String(s).replace(/\s+/g, '').toLowerCase() }
function getBaseName(n: string) { return n.trim().replace(/[12]?\s*\([12]기\)/, '').replace(/\s*[12]\s*$/, '').trim() }
function getPeriod(n: string) { const m = n.match(/\(([12]기)\)/); return m ? m[1] : null }

function parseApps(text: unknown) {
  if (!text) return []
  const re = /(\[(\d+기)\]\[주제선택\((화|목)\)\](.+?))(?=\r?\n|\[|$)/g
  const out: { raw: string; period: string; day: string; name: string }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(String(text))) !== null)
    out.push({ raw: m[1], period: m[2], day: m[3], name: m[4].trim() })
  return out
}

function validateFile(type: SlotKey, data: ArrayBuffer): string | null {
  try {
    const wb = XLSX.read(data, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
    if (!rows.length) return '빈 파일입니다.'
    const cols = Object.keys(rows[0])

    if (type === 'student') {
      const m = S_COLS.filter(c => !cols.includes(c))
      if (m.length) return A_COLS.every(c => cols.includes(c))
        ? '이 파일은 활동목록입니다. 학생목록을 넣어주세요.'
        : `학생목록 아님 (${m.join(', ')} 없음)`
      if (cols.includes('활동코드') && rows[0]['활동코드'] != null)
        return '이 파일은 배정결과입니다. 학생목록을 넣어주세요.'
    } else if (type === 'activity') {
      const m = A_COLS.filter(c => !cols.includes(c))
      if (m.length) return S_COLS.every(c => cols.includes(c))
        ? '이 파일은 학생목록입니다. 활동목록을 넣어주세요.'
        : `활동목록 아님 (${m.join(', ')} 없음)`
    } else {
      const rr = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })
      let hr: string[] | null = null
      for (const r of rr) {
        if (Array.isArray(r) && r.some(c => String(c || '').includes('수강목록'))) {
          hr = r.map(c => String(c || '').trim())
          break
        }
      }
      if (!hr) {
        if (S_COLS.every(c => cols.includes(c))) return '이 파일은 학생목록입니다. 신청자목록을 넣어주세요.'
        if (A_COLS.every(c => cols.includes(c))) return '이 파일은 활동목록입니다. 신청자목록을 넣어주세요.'
        return '신청자목록 아님 (수강목록 컬럼 없음)'
      }
      const m = ['학년','반','번호','수강목록'].filter(c => !hr!.includes(c))
      if (m.length) return `신청자목록 아님 (${m.join(', ')} 없음)`
    }
    return null
  } catch { return '파일을 읽을 수 없습니다.' }
}

// --- process ---
function runProcess(files: Record<SlotKey, FileSlot>) {
  const logs: LogEntry[] = []
  const log = (t: LogEntry['t'], m: string) => logs.push({ t, m })

  try {
    const sWb = XLSX.read(files.student.data, { type: 'array' })
    const students = XLSX.utils.sheet_to_json<Record<string, unknown>>(sWb.Sheets[sWb.SheetNames[0]], { defval: null })
    log('info', `학생목록: ${students.length}명`)

    const aWb = XLSX.read(files.activity.data, { type: 'array' })
    const activities = XLSX.utils.sheet_to_json<Record<string, unknown>>(aWb.Sheets[aWb.SheetNames[0]], { defval: null })
      .filter(r => r['활동코드'] != null && r['활동명'] != null)
    log('info', `활동목록: ${activities.length}개`)

    const applyWb = XLSX.read(files.apply.data, { type: 'array' })
    const rr = XLSX.utils.sheet_to_json<unknown[]>(applyWb.Sheets[applyWb.SheetNames[0]], { header: 1, defval: null })
    let hi = -1
    for (let i = 0; i < rr.length; i++)
      if (rr[i] && (rr[i] as unknown[]).some(c => String(c || '').includes('수강목록'))) { hi = i; break }
    if (hi === -1) throw new Error('신청자목록에서 헤더를 찾을 수 없습니다.')

    const hdr = (rr[hi] as unknown[]).map(c => String(c || '').trim())
    const dr = rr.slice(hi + 1)
      .filter(r => r && (r as unknown[]).some(c => c != null))
      .map(r => {
        const o: Record<string, unknown> = {}
        hdr.forEach((h, i) => { o[h] = (r as unknown[])[i] })
        return o
      })
    log('info', `신청자목록: ${dr.length}명`)

    const g = Number(students[0]['학년']), b = Number(students[0]['반코드'])
    const ca = dr.filter(r => Number(r['학년']) === g && Number(r['반']) === b)
    log('info', `${g}학년 ${b}반 신청자: ${ca.length}명`)

    const aMap = new Map<string, Record<string, unknown>[]>()
    const aBase = new Map<string, string>()
    for (const a of activities) {
      const bn = getBaseName(String(a['활동명'])), p = getPeriod(String(a['활동명']))
      if (!p) continue
      const k = `${norm(bn)}|${p}`
      if (!aMap.has(k)) { aMap.set(k, []); aBase.set(k, bn) }
      aMap.get(k)!.push(a)
    }

    const result: Record<string, unknown>[] = []
    const maps: MapEntry[] = []
    const seen = new Set<string>()
    let matched = 0, unmatched = 0, noApply = 0
    const byNum = new Map<number, Record<string, unknown>>()
    for (const r of ca) byNum.set(Number(r['번호']), r)

    for (const s of students) {
      const n = Number(s['번호']), ar = byNum.get(n)
      if (!ar) { log('warn', `${n}번 ${s['성명']}: 신청자목록에 없음`); noApply++; continue }
      const apps = parseApps(ar['수강목록'])
      if (!apps.length) { log('warn', `${n}번 ${s['성명']}: 수강목록 파싱 실패`); noApply++; continue }

      for (const app of apps) {
        const nn = norm(app.name), k = `${nn}|${app.period}`
        let cand = aMap.get(k) || []
        let mt: string = cand.length ? 'exact' : 'fail'
        if (cand.length && aBase.get(k) !== app.name) mt = 'norm'
        if (!cand.length) {
          for (const [mk, mv] of aMap.entries()) {
            const [kn, kp] = mk.split('|')
            if (kp === app.period && (nn.includes(kn) || kn.includes(nn))) {
              cand = mv; mt = 'fuzzy'; break
            }
          }
        }

        const mk = `${app.name}|${app.period}|${app.day}`
        if (!seen.has(mk)) {
          seen.add(mk)
          maps.push({ raw: app.raw, mt: cand.length ? mt : 'fail', code: null, name: null })
        }
        if (!cand.length) {
          log('err', `${n}번 ${s['성명']}: "${app.name}" (${app.period}) → 없음`)
          unmatched++; continue
        }

        const ps = app.day === '화' ? '1' : '2'
        const act = cand.find(a => {
          const m = String(a['활동명']).match(/(\d)\s*\([12]기\)/)
          return m && m[1] === ps
        }) || cand[0]

        const last = maps[maps.length - 1]
        if (last && !last.code) {
          last.code = String(act['활동코드'])
          last.name = String(act['활동명'])
        }

        result.push({
          '학년도': s['학년도'], '학기코드': s['학기코드'], '학기명': s['학기명'],
          '과정코드': s['과정코드'], '과정명': s['과정명'], '학년': s['학년'],
          '반코드': s['반코드'], '번호': s['번호'], '학생개인번호': s['학생개인번호'],
          '성명': s['성명'], '영역코드': act['영역코드'], '영역명': act['영역명'],
          '활동코드': act['활동코드'], '활동명': act['활동명'],
        })
        matched++
      }
    }

    const nc = maps.filter(d => d.mt === 'norm').length
    const fc = maps.filter(d => d.mt === 'fuzzy').length
    const fl = maps.filter(d => d.mt === 'fail').length
    if (nc) log('warn', `띄어쓰기 차이 매칭: ${nc}건`)
    if (fc) log('warn', `퍼지 매칭: ${fc}건`)
    if (fl) log('err', `매핑 실패: ${fl}건`)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result), 'Sheet1')

    return {
      stats: { total: students.length, matched, noApply, unmatched },
      logs, maps, wb,
    }
  } catch (e) {
    log('err', `오류: ${(e as Error).message}`)
    return { stats: { total: 0, matched: 0, noApply: 0, unmatched: 0 }, logs, maps: [], wb: null }
  }
}

// --- components ---
function FileZone({ slot, file, error, onFile }: {
  slot: typeof SLOTS[number]
  file: FileSlot | null
  error: string | null
  onFile: (key: SlotKey, file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setOver(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(slot.key, f)
  }, [slot.key, onFile])

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className="relative rounded-xl p-6 text-center cursor-pointer transition-all"
      style={{
        border: `2px ${file ? 'solid' : 'dashed'} ${error ? '#e74c3c' : file ? '#4E9B7E' : over ? '#4E9B7E' : '#ccc'}`,
        background: over ? '#f0f5f2' : '#fafaf8',
      }}
    >
      {file && !error && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{ background: '#4E9B7E', color: '#fff' }}>✓</div>
      )}
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(slot.key, f) }} />
      <div className="text-3xl mb-2">{slot.icon}</div>
      <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#5E8FA6' }}>{slot.label}</div>
      <div className="text-xs" style={{ color: '#888' }}>{slot.hint}</div>
      {file && <div className="text-xs mt-2 break-all font-mono" style={{ color: '#4E9B7E' }}>{file.name}</div>}
      {error && <div className="text-[11px] mt-2 font-medium" style={{ color: '#e74c3c' }}>{error}</div>}
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: '#fafaf8', border: '1px solid #ddd' }}>
      <div className="text-3xl font-bold font-mono leading-none mb-1.5" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: '#888' }}>{label}</div>
    </div>
  )
}

// --- main ---
export default function AssignmentTool() {
  const [files, setFiles] = useState<Record<SlotKey, FileSlot | null>>({ student: null, activity: null, apply: null })
  const [errors, setErrors] = useState<Record<SlotKey, string | null>>({ student: null, activity: null, apply: null })
  const [result, setResult] = useState<{ stats: Stats; logs: LogEntry[]; maps: MapEntry[]; wb: XLSX.WorkBook | null } | null>(null)
  const [mapOpen, setMapOpen] = useState(true)

  const handleFile = useCallback((key: SlotKey, file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const data = e.target?.result as ArrayBuffer
      const err = validateFile(key, data)
      setErrors(prev => ({ ...prev, [key]: err }))
      setFiles(prev => ({ ...prev, [key]: err ? null : { name: file.name, data } }))
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const ready = files.student && files.activity && files.apply

  const handleRun = () => {
    if (!ready) return
    const r = runProcess(files as Record<SlotKey, FileSlot>)
    setResult(r)
  }

  const handleDownload = () => {
    if (!result?.wb) return
    const d = new Date()
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    XLSX.writeFile(result.wb, `주제선택_배정결과_${ts}.xlsx`)
  }

  const assigned = result ? (result.stats.matched > 0 ? Math.round(result.stats.matched / 4) : 0) : 0
  const sortedMaps = result ? [...result.maps].sort((a, b) => {
    if (!a.code && !b.code) return 0
    if (!a.code) return 1
    if (!b.code) return -1
    return a.code.localeCompare(b.code)
  }) : []
  const warnCount = result ? result.maps.filter(d => d.mt !== 'exact').length : 0

  return (
    <div className="w-[794px]">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: '#1E2A1E' }}>
          주제선택 <span style={{ color: '#4E9B7E' }}>배정결과</span> 생성기
        </h1>
        <p className="text-sm" style={{ color: '#888' }}>학생목록 · 활동목록 · 신청자목록 → 배정결과 xlsx 자동 생성</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {SLOTS.map(s => (
          <FileZone key={s.key} slot={s} file={files[s.key]} error={errors[s.key]} onFile={handleFile} />
        ))}
      </div>

      <div className="text-center mb-8">
        <button onClick={handleRun} disabled={!ready}
          className="px-10 py-3 rounded-lg font-bold text-[15px] cursor-pointer transition-all border-none disabled:opacity-35 disabled:cursor-not-allowed"
          style={{ background: '#4E9B7E', color: '#fff' }}>
          배정결과 생성
        </button>
      </div>

      {result && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <StatCard value={result.stats.total} label="전체 학생" color="#4E9B7E" />
            <StatCard value={assigned} label="배정 완료" color="#4E9B7E" />
            <StatCard value={result.stats.noApply} label="미신청/누락" color={result.stats.noApply ? '#C9A24E' : '#4E9B7E'} />
            <StatCard value={result.stats.unmatched} label="매핑 실패" color={result.stats.unmatched ? '#e74c3c' : '#4E9B7E'} />
          </div>

          {sortedMaps.length > 0 && (
            <div className="rounded-xl p-5 mb-5" style={{ background: '#fafaf8', border: '1px solid #ddd' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 cursor-pointer select-none"
                style={{ color: '#888' }} onClick={() => setMapOpen(!mapOpen)}>
                <span style={{ display: 'inline-block', transition: 'transform .2s', transform: mapOpen ? '' : 'rotate(-90deg)', borderTop: '6px solid #888', borderLeft: '5px solid transparent', borderRight: '5px solid transparent' }} />
                과목명 매핑 검수
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono"
                  style={{ background: warnCount ? '#FBF2E0' : '#E2EFEA', color: warnCount ? '#7D6118' : '#1D6B4F' }}>
                  {warnCount ? `${warnCount}건 주의` : '모두 정확 일치'}
                </span>
              </h3>
              {mapOpen && (
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="mb-3 text-[13px] leading-relaxed" style={{ color: '#888' }}>
                    <strong style={{ color: '#1E2A1E' }}>적용 규칙</strong><br />
                    1. 과목명 매칭: 공백 제거 후 비교 → 부분 일치<br />
                    2. 요일→반: <strong style={{ color: '#5E8FA6' }}>화→반1</strong> | <strong style={{ color: '#5E8FA6' }}>목→반2</strong>
                  </div>
                  <table className="w-full text-[13px] font-mono" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['입력 (신청자목록)', '', '활동코드', '활동명 (활동목록)', '비고'].map(t => (
                          <th key={t} className="text-left p-2 text-[11px] uppercase tracking-wide font-bold"
                            style={{ color: '#888', borderBottom: '2px solid #ddd' }}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMaps.map((d, i) => (
                        <tr key={i}>
                          <td className="p-1.5 px-2" style={{ borderBottom: '1px solid #eee' }}>{d.raw?.trim() || '-'}</td>
                          <td className="p-1.5" style={{ borderBottom: '1px solid #eee', color: '#888' }}>→</td>
                          <td className="p-1.5 px-2" style={{ borderBottom: '1px solid #eee' }}>{d.code || '-'}</td>
                          <td className="p-1.5 px-2" style={{ borderBottom: '1px solid #eee' }}>{d.name || '-'}</td>
                          <td className="p-1.5 px-2 text-xs" style={{ borderBottom: '1px solid #eee' }}>
                            {d.mt === 'norm' ? '공백 차이' : d.mt === 'fuzzy' ? '부분 일치' : d.mt === 'fail' ? <span style={{ color: '#e74c3c' }}>활동목록에 없음</span> : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl p-5 mb-5 max-h-[360px] overflow-y-auto" style={{ background: '#fafaf8', border: '1px solid #ddd' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#888' }}>처리 로그</h3>
            {result.logs.map((l, i) => (
              <div key={i} className="text-[13px] py-1 font-mono flex gap-2.5 items-baseline"
                style={{ borderBottom: i < result.logs.length - 1 ? '1px solid #eee' : 'none' }}>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{
                  background: l.t === 'warn' ? '#FBF2E0' : l.t === 'err' ? '#FCE8E8' : '#E4EDF2',
                  color: l.t === 'warn' ? '#7D6118' : l.t === 'err' ? '#e74c3c' : '#5E8FA6',
                }}>{l.t === 'warn' ? '⚠' : l.t === 'err' ? '✕' : 'i'}</span>
                <span>{l.m}</span>
              </div>
            ))}
          </div>

          <div className="text-center p-6 rounded-xl" style={{ background: '#fafaf8', border: '1px solid #ddd' }}>
            <p className="text-[13px] mb-3" style={{ color: '#888' }}>
              {assigned}명 × 4개 = {result.stats.matched}행 생성 완료
            </p>
            <button onClick={handleDownload} disabled={!result.wb}
              className="px-10 py-3 rounded-lg font-bold text-[15px] cursor-pointer transition-all border-none disabled:opacity-35"
              style={{ background: '#5E8FA6', color: '#fff' }}>
              ⬇ 배정결과 xlsx 다운로드
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
