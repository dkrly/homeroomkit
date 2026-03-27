import { useState, useRef, useCallback, useEffect } from 'react'
import ClassTimetable from './components/ClassTimetable'
import Schedule from './components/Schedule'
import RoleAssign from './components/RoleAssign'
import TeacherTimetable from './components/TeacherTimetable'
import StudentList from './components/StudentList'
import Seating from './components/Seating'
import FriendBingo from './components/FriendBingo'
import Settings from './components/Settings'
import TimetableSchedule from './components/TimetableSchedule'
import PrintButton from './components/PrintButton'
import AssignmentTool from './components/AssignmentTool'
import PhotoTool from './components/PhotoTool'
import StarCatcher from './components/StarCatcher'
import { hashPassword } from './utils/crypto'
type TabId = 'students' | 'timetable' | 'teacher' | 'schedule' | 'combo' | 'role' | 'seating' | 'bingo' | 'assignment' | 'photo' | 'game' | 'settings'

interface NavGroup {
  icon: string
  label: string
  items: { id: TabId; label: string }[]
}

const navGroups: NavGroup[] = [
  { icon: '🧑‍🏫', label: '정보 시간표', items: [{ id: 'teacher', label: '정보 시간표' }] },
  { icon: '🏫', label: '우리반', items: [
    { id: 'students', label: '학생' },
    { id: 'timetable', label: '시간표' },
    { id: 'schedule', label: '일과운영표' },
    { id: 'combo', label: '시간+일과' },
    { id: 'role', label: '역할' },
    { id: 'seating', label: '자리' },
  ]},
  { icon: '🛠️', label: '도구', items: [
    { id: 'bingo', label: '친구탐험' },
    { id: 'assignment', label: '주제선택 배정' },
    { id: 'photo', label: '증명사진' },
    { id: 'game', label: '별 잡기 게임' },
  ]},
]

const pages: Record<TabId, React.FC> = {
  students: StudentList,
  timetable: ClassTimetable,
  teacher: TeacherTimetable,
  schedule: Schedule,
  role: RoleAssign,
  seating: Seating,
  bingo: FriendBingo,
  combo: TimetableSchedule,
  assignment: AssignmentTool,
  photo: PhotoTool,
  game: StarCatcher,
  settings: Settings,
}

const noPrintButton = new Set<TabId>(['role', 'seating', 'bingo', 'assignment', 'photo', 'game', 'settings'])

const printTitles: Partial<Record<TabId, string>> = {
  students: '우리반_학생',
  timetable: '우리반_시간표',
  teacher: '정보_시간표',
  schedule: '일과운영표',
  combo: '시간표_일과운영표',
}

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 1.5
const ZOOM_KEY = 'homeroomkit-zoom'

function loadZoom(): number {
  const v = localStorage.getItem(ZOOM_KEY)
  return v ? Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(v))) : 1
}

const validTabs = new Set<string>(Object.keys(pages))

function getTabFromHash(): TabId {
  const h = window.location.hash.replace('#', '')
  return validTabs.has(h) ? h as TabId : 'timetable'
}

const pageStyle = (tab: TabId) =>
  tab === 'combo'
    ? '@page { size: 594mm 420mm; margin: 0; }'
    : '@page { size: A4 portrait; margin: 0; }'

export default function App() {
  const [tab, setTabState] = useState<TabId>(getTabFromHash)
  const setTab = useCallback((id: TabId) => {
    setTabState(id)
    window.location.hash = id === 'timetable' ? '' : id
  }, [])

  // 뒤로가기/앞으로가기 대응
  useEffect(() => {
    const onHash = () => setTabState(getTabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [zoom, setZoom] = useState(loadZoom)
  const [settingsAuthed, setSettingsAuthed] = useState(false)
  const [settingsPw, setSettingsPw] = useState('')
  const [settingsErr, setSettingsErr] = useState('')
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const Page = pages[tab]

  const handleVersionTap = () => {
    tapCount.current++
    clearTimeout(tapTimer.current)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      setTab('settings')
      setDrawerOpen(false)
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 1500)
    }
  }

  const handleSettingsLogin = useCallback(async () => {
    setSettingsErr('')
    const hash = await hashPassword(settingsPw)
    if (hash === __PASSWORD_HASH__) {
      setSettingsAuthed(true)
      setSettingsPw('')
    } else {
      setSettingsErr('비밀번호가 틀렸습니다')
    }
  }, [settingsPw])

  const selectTab = (id: TabId) => {
    setTab(id)
    setDrawerOpen(false)
  }

  const changeZoom = (delta: number) => {
    setZoom(prev => {
      const next = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev + delta)) * 10) / 10
      localStorage.setItem(ZOOM_KEY, String(next))
      return next
    })
  }

  return (
    <>
    <style>{pageStyle(tab)}</style>
    <div className="print-reset flex h-screen relative">
      {/* 상단 바: 햄버거 + 줌 */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2 print:hidden"
        style={{ display: drawerOpen ? 'none' : 'flex' }}>
        <button onClick={() => setDrawerOpen(true)}
          className="w-11 h-11 rounded-2xl bg-ink/90 text-bg flex items-center justify-center border-none cursor-pointer backdrop-blur-sm"
          style={{ boxShadow: '0 2px 12px rgba(30,42,30,0.15)' }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-1 h-11 rounded-2xl px-2 bg-ink/90 backdrop-blur-sm"
          style={{ boxShadow: '0 2px 12px rgba(30,42,30,0.15)' }}>
          <button onClick={() => changeZoom(-ZOOM_STEP)}
            className="w-7 h-7 rounded-lg bg-bg/10 text-bg/60 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-sm font-bold">
            −
          </button>
          <span className="text-[10px] text-bg/50 font-mono w-8 text-center">{Math.round(zoom * 100)}</span>
          <button onClick={() => changeZoom(ZOOM_STEP)}
            className="w-7 h-7 rounded-lg bg-bg/10 text-bg/60 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-sm font-bold">
            +
          </button>
        </div>
      </div>

      {/* 오버레이 */}
      <div className={`fixed inset-0 z-40 print:hidden transition-colors duration-200
        ${drawerOpen ? 'bg-black/25 pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)} />

      {/* 드로어 */}
      <nav className={`fixed top-0 left-0 z-50 h-full w-72 bg-ink flex flex-col print:hidden transition-transform duration-200 ease-out
        ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: drawerOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none' }}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 h-16 shrink-0"
          style={{ borderBottom: '1px solid rgba(246,247,242,0.08)' }}>
          <span className="text-bg font-bold tracking-tight">담임 운영 키트</span>
          <button onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-lg bg-bg/5 text-bg/40 hover:bg-bg/15 hover:text-bg border-none cursor-pointer text-sm transition-colors">
            ✕
          </button>
        </div>

        {/* 메뉴 */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {navGroups.map((group, gi) => {
            const isActiveGroup = group.items.some(i => i.id === tab)
            const isSingle = group.items.length === 1

            return (
              <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
                {isSingle ? (
                  <button
                    onClick={() => selectTab(group.items[0].id)}
                    className={`w-full h-11 rounded-xl flex items-center gap-3 px-4 transition-all cursor-pointer border-none text-[13px] font-semibold relative
                      ${isActiveGroup ? 'bg-bg text-ink' : 'bg-transparent text-bg/60 hover:bg-bg/8 hover:text-bg'}`}
                  >
                    <span className="text-base w-6 text-center">{group.icon}</span>
                    {group.label}
                  </button>
                ) : (
                  <>
                    <div className={`flex items-center gap-3 px-4 h-9 text-[11px] font-bold uppercase tracking-widest mt-2 mb-0.5
                      ${isActiveGroup ? 'text-bg/70' : 'text-bg/30'}`}>
                      <span className="text-sm w-6 text-center">{group.icon}</span>
                      {group.label}
                    </div>
                    <div className="flex flex-col gap-px">
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => selectTab(item.id)}
                          className={`w-full h-10 rounded-xl flex items-center text-[13px] font-medium transition-all cursor-pointer border-none relative
                            ${tab === item.id
                              ? 'bg-bg text-ink'
                              : 'bg-transparent text-bg/50 hover:bg-bg/8 hover:text-bg'
                            }`}
                          style={{ paddingLeft: '3.25rem' }}
                        >
                          {tab === item.id && (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-ink" />
                          )}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* 하단 */}
        <div className="px-6 py-4 shrink-0 text-center" style={{ borderTop: '1px solid rgba(246,247,242,0.08)' }}>
          <span onClick={handleVersionTap}
            className="text-[10px] text-bg/20 cursor-default select-none">
            {__BUILD_VERSION__}
          </span>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="print-reset flex-1 flex justify-center items-start overflow-auto p-8 pt-16">
        {tab === 'settings' && !settingsAuthed ? (
          <div className="flex items-center justify-center py-20">
            <div className="rounded-2xl p-8 w-80" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#1E2A1E' }}>설정</h2>
              <p className="text-sm mb-4" style={{ color: '#1E2A1E', opacity: 0.5 }}>비밀번호를 입력하세요</p>
              <form onSubmit={e => { e.preventDefault(); handleSettingsLogin().catch(() => setSettingsErr('인증 오류')) }}>
                <input
                  type="password"
                  value={settingsPw}
                  onChange={e => { setSettingsPw(e.target.value); setSettingsErr('') }}
                  className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                  style={{ border: '1px solid #ddd', outline: 'none' }}
                  placeholder="비밀번호"
                  autoFocus
                />
                {settingsErr && <p className="text-xs mb-2" style={{ color: '#e74c3c' }}>{settingsErr}</p>}
                <div className="flex gap-2">
                  <button type="submit"
                    className="flex-1 py-2 rounded-lg font-bold text-sm border-none cursor-pointer"
                    style={{ background: '#1E2A1E', color: '#F6F7F2' }}>
                    확인
                  </button>
                  <button type="button" onClick={() => { setTab('timetable'); setSettingsPw(''); setSettingsErr('') }}
                    className="px-4 py-2 rounded-lg text-sm border-none cursor-pointer"
                    style={{ background: '#eee', color: '#666' }}>
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="print-reset origin-top" style={{ zoom }}>
            {!noPrintButton.has(tab) && <PrintButton title={printTitles[tab]} />}
            <Page />
          </div>
        )}
      </main>
    </div>
    </>
  )
}
