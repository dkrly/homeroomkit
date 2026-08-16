import { useState } from 'react'
import { connectSheet } from '../sheet/client'
import { parseSource } from '../sheet/source'
import { readLegacyData } from '../store'

type Mode = 'sheet' | 'script'

const GUIDES: Record<Mode, { title: string; note: string; steps: string[] }> = {
  sheet: {
    title: '구글 시트 주소',
    note: '시트를 링크 공개로 두어야 합니다. 링크를 아는 사람은 학생 명단을 볼 수 있습니다.',
    steps: [
      '시트에 학급 · 학생 · 역할 · 거리두기 · 친구탐험 · 반시간표 · 정보시간표 · 일과표 탭을 만듭니다. (아래 Apps Script 방식의 초기 세팅을 한 번 돌리면 자동으로 만들어집니다)',
      '시트 오른쪽 위 공유 → 일반 액세스를 "링크가 있는 모든 사용자 · 뷰어" 로 바꿉니다.',
      '주소창의 시트 주소를 그대로 아래에 붙여넣습니다.',
    ],
  },
  script: {
    title: 'Apps Script 웹 앱 주소',
    note: '시트를 비공개로 유지할 수 있습니다. 대신 처음 한 번 배포 과정이 필요합니다.',
    steps: [
      '시트에서 확장 프로그램 → Apps Script 를 열고, 저장소의 apps-script/Code.gs 내용을 붙여넣고 저장합니다.',
      '시트로 돌아와 새로고침하면 [담임키트] 메뉴가 생깁니다. [담임키트] → 시트 초기 세팅 을 실행하면 탭 8개가 기본값과 함께 만들어집니다.',
      '배포 → 새 배포 → 유형 "웹 앱", 실행 계정 "나", 액세스 권한 "모든 사용자" 로 배포합니다.',
      '나온 웹 앱 주소(.../exec)를 아래에 붙여넣습니다.',
    ],
  },
}

export default function SheetSetup() {
  const [mode, setMode] = useState<Mode>('sheet')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const legacy = readLegacyData()

  const detected = parseSource(url)

  const handleConnect = async () => {
    setError('')
    if (!detected) {
      setError('구글 시트 주소(docs.google.com/spreadsheets/...) 또는 Apps Script 웹 앱 주소(script.google.com/...)를 붙여넣어 주세요.')
      return
    }
    setLoading(true)
    try {
      await connectSheet(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const copyStudents = async () => {
    if (!legacy?.students.length) return
    const tsv = legacy.students.map(s => `${s.num}\t${s.name}`).join('\n')
    await navigator.clipboard.writeText(tsv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const guide = GUIDES[mode]

  return (
    <div className="w-full max-w-[640px] mx-auto py-10">
      <div className="rounded-2xl bg-bg p-9" style={{ boxShadow: '0 4px 24px rgba(30,42,30,0.08)' }}>
        <h1 className="text-2xl font-black text-ink mb-1.5">내 시트 연결</h1>
        <p className="text-sm text-ink/50 mb-6 leading-relaxed">
          학생 명단, 역할, 자리, 친구탐험 질문, 시간표, 일과운영표를 모두 구글 시트에서 관리합니다.<br />
          한 번 연결하면 이 브라우저에 저장되어 다음부터는 바로 열립니다.
        </p>

        <div className="flex gap-1 p-1 rounded-xl bg-period-bg mb-5">
          {(['sheet', 'script'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors
                ${mode === m ? 'bg-ink text-bg' : 'bg-transparent text-ink/45 hover:text-ink/75'}`}
            >
              {m === 'sheet' ? '시트 주소로 연결' : 'Apps Script로 연결'}
            </button>
          ))}
        </div>

        <p className="text-xs text-ink/45 mb-4 leading-relaxed px-1">{guide.note}</p>

        <ol className="flex flex-col gap-2.5 mb-7">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink/70 leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-ink text-bg grid place-items-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <label className="block text-sm font-bold text-ink mb-2">{guide.title}</label>
        <input
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') void handleConnect() }}
          placeholder={mode === 'sheet'
            ? 'https://docs.google.com/spreadsheets/d/.../edit'
            : 'https://script.google.com/macros/s/.../exec'}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono"
          style={{ border: '1px solid #D5DBCA', outline: 'none', background: '#fff' }}
          autoFocus
        />
        {url.trim() && detected && (
          <p className="text-xs text-ink/40 mt-2">{detected.label} 주소로 인식했습니다.</p>
        )}
        {error && <p className="text-xs text-danger mt-2 leading-relaxed">{error}</p>}

        <button
          onClick={() => void handleConnect()}
          disabled={loading || !url.trim()}
          className="mt-4 w-full py-3 rounded-xl font-bold text-sm border-none cursor-pointer bg-ink text-bg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? '연결 중...' : '연결'}
        </button>

        {legacy && legacy.students.length > 0 && (
          <div className="mt-7 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
            <p className="text-sm font-bold text-ink mb-1">이전 버전 학생 명단 {legacy.students.length}명</p>
            <p className="text-xs text-ink/45 mb-3 leading-relaxed">
              이 기기에 남아 있는 명단입니다. 복사해서 시트의 <b>학생</b> 탭 2행부터 붙여넣으세요.
            </p>
            <button
              onClick={() => void copyStudents()}
              className="px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer"
              style={{ background: '#EAEDE2', color: '#1E2A1E' }}
            >
              {copied ? '복사됨' : '번호·이름 복사'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
