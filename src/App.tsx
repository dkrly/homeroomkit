import { useState, useRef } from 'react'
import ClassTimetable from './components/ClassTimetable'
import Schedule from './components/Schedule'
import RoleAssign from './components/RoleAssign'
import TeacherTimetable from './components/TeacherTimetable'
import StudentList from './components/StudentList'
import Seating from './components/Seating'
import SeatingSemester1 from './components/SeatingSemester1'
import RoleSemester1 from './components/RoleSemester1'
import FriendBingo from './components/FriendBingo'
import Settings from './components/Settings'
import TimetableSchedule from './components/TimetableSchedule'
import PrintButton from './components/PrintButton'
import AssignmentTool from './components/AssignmentTool'

type TabId = 'students' | 'timetable' | 'teacher' | 'schedule' | 'combo' | 'role' | 'role1' | 'seating' | 'seating1' | 'bingo' | 'assignment' | 'settings'

interface NavGroup {
  icon: string
  label: string
  items: { id: TabId; label: string }[]
}

const navGroups: NavGroup[] = [
  { icon: '👥', label: '학생', items: [{ id: 'students', label: '학생' }] },
  { icon: '📋', label: '시간표', items: [
    { id: 'timetable', label: '1학년2반' },
    { id: 'teacher', label: '정보' },
    { id: 'schedule', label: '일과운영표' },
    { id: 'combo', label: '시간+일과' },
  ]},
  { icon: '🎲', label: '역할', items: [
    { id: 'role', label: '1인1역' },
    { id: 'role1', label: '우리반 역할' },
  ]},
  { icon: '💺', label: '자리', items: [
    { id: 'seating', label: '자리배치' },
    { id: 'seating1', label: '우리반 자리' },
  ]},
  { icon: '🔍', label: '친구탐험', items: [{ id: 'bingo', label: '친구탐험' }] },
  { icon: '📊', label: '배정', items: [{ id: 'assignment', label: '주제선택 배정' }] },
]

const pages: Record<TabId, React.FC> = {
  students: StudentList,
  timetable: ClassTimetable,
  teacher: TeacherTimetable,
  schedule: Schedule,
  role: RoleAssign,
  role1: RoleSemester1,
  seating: Seating,
  seating1: SeatingSemester1,
  bingo: FriendBingo,
  combo: TimetableSchedule,
  assignment: AssignmentTool,
  settings: Settings,
}

const noPrintButton = new Set<TabId>(['role', 'role1', 'seating', 'seating1', 'bingo', 'assignment', 'settings'])

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 1.5
const ZOOM_KEY = 'homeroomkit-zoom'

function loadZoom(): number {
  const v = localStorage.getItem(ZOOM_KEY)
  return v ? Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(v))) : 1
}

const pageStyle = (tab: TabId) =>
  tab === 'combo'
    ? '@page { size: 594mm 420mm; margin: 0; }'
    : '@page { size: A4 portrait; margin: 0; }'

export default function App() {
  const [tab, setTab] = useState<TabId>('timetable')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [zoom, setZoom] = useState(loadZoom)
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
      {/* 햄버거 버튼 */}
      <button onClick={() => setDrawerOpen(true)}
        className="fixed top-4 left-4 z-40 w-10 h-10 rounded-xl bg-ink text-bg flex items-center justify-center border-none cursor-pointer text-lg print:hidden shadow-lg"
        style={{ display: drawerOpen ? 'none' : 'flex' }}>
        ☰
      </button>

      {/* 오버레이 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 print:hidden"
          onClick={() => setDrawerOpen(false)} />
      )}

      {/* 드로어 */}
      <nav className={`fixed top-0 left-0 z-50 h-full w-64 bg-ink flex flex-col print:hidden transition-transform duration-200 ease-out shadow-2xl
        ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-bg font-bold text-sm">담임 운영 키트</span>
          <button onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-lg bg-bg/10 text-bg/60 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-lg">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {navGroups.map((group, gi) => {
            const isActiveGroup = group.items.some(i => i.id === tab)
            const isSingle = group.items.length === 1

            return (
              <div key={gi} className="mb-1">
                {isSingle ? (
                  <button
                    onClick={() => selectTab(group.items[0].id)}
                    className={`w-full h-11 rounded-xl flex items-center gap-3 px-4 transition-all cursor-pointer border-none text-sm font-semibold
                      ${isActiveGroup ? 'bg-bg text-ink' : 'bg-transparent text-bg/60 hover:bg-bg/10 hover:text-bg'}`}
                  >
                    <span className="text-lg">{group.icon}</span>
                    {group.label}
                  </button>
                ) : (
                  <>
                    <div className={`w-full h-9 flex items-center gap-3 px-4 text-xs font-bold uppercase tracking-wider
                      ${isActiveGroup ? 'text-bg' : 'text-bg/40'}`}>
                      <span className="text-base">{group.icon}</span>
                      {group.label}
                    </div>
                    <div className="flex flex-col gap-0.5 ml-4">
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => selectTab(item.id)}
                          className={`w-full h-9 rounded-lg flex items-center px-4 text-sm font-medium transition-all cursor-pointer border-none
                            ${tab === item.id
                              ? 'bg-bg text-ink'
                              : 'bg-transparent text-bg/50 hover:bg-bg/10 hover:text-bg'
                            }`}
                        >
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

        <div className="px-5 py-4 flex flex-col gap-3 border-t border-bg/10">
          <div className="flex items-center gap-2">
            <button onClick={() => changeZoom(-ZOOM_STEP)}
              className="w-8 h-8 rounded-lg bg-bg/10 text-bg/60 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-sm font-bold">
              -
            </button>
            <span className="text-xs text-bg/40 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => changeZoom(ZOOM_STEP)}
              className="w-8 h-8 rounded-lg bg-bg/10 text-bg/60 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-sm font-bold">
              +
            </button>
          </div>
          <span onClick={handleVersionTap}
            className="text-[9px] text-bg/30 cursor-default select-none">
            {__BUILD_VERSION__}
          </span>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="print-reset flex-1 flex justify-center items-start overflow-auto p-8 pt-16">
        <div className="print-reset origin-top" style={{ zoom }}>
          {!noPrintButton.has(tab) && <PrintButton />}
          <Page />
        </div>
      </main>
    </div>
    </>
  )
}
