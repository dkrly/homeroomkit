import { useState } from 'react'
import { connectSheet, looksLikeWebAppUrl } from '../sheet/client'
import { readLegacyData } from '../store'

const STEPS = [
  '구글 시트를 새로 만듭니다.',
  '확장 프로그램 → Apps Script 를 열고, 저장소의 apps-script/Code.gs 내용을 붙여넣고 저장합니다.',
  '시트로 돌아와 새로고침하면 상단에 [담임키트] 메뉴가 생깁니다. [담임키트] → 시트 초기 세팅 을 실행합니다.',
  '배포 → 새 배포 → 유형 "웹 앱", 실행 계정 "나", 액세스 권한 "모든 사용자" 로 배포합니다.',
  '나온 웹 앱 URL 을 아래에 붙여넣습니다.',
]

export default function SheetSetup() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const legacy = readLegacyData()

  const handleConnect = async () => {
    setError('')
    if (!looksLikeWebAppUrl(url)) {
      setError('script.google.com 으로 시작하는 웹 앱 URL 을 붙여넣어 주세요.')
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

  return (
    <div className="w-full max-w-[640px] mx-auto py-10">
      <div className="rounded-2xl bg-bg p-9" style={{ boxShadow: '0 4px 24px rgba(30,42,30,0.08)' }}>
        <h1 className="text-2xl font-black text-ink mb-1.5">구글 시트 연결</h1>
        <p className="text-sm text-ink/50 mb-7 leading-relaxed">
          학생 명단, 역할, 자리, 친구탐험 질문, 시간표, 일과운영표를 모두 구글 시트에서 관리합니다.<br />
          시트는 비공개로 두어도 됩니다.
        </p>

        <ol className="flex flex-col gap-2.5 mb-7">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink/70 leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-ink text-bg grid place-items-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <label className="block text-sm font-bold text-ink mb-2">웹 앱 URL</label>
        <input
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') void handleConnect() }}
          placeholder="https://script.google.com/macros/s/.../exec"
          className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono"
          style={{ border: '1px solid #D5DBCA', outline: 'none', background: '#fff' }}
          autoFocus
        />
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
