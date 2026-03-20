import { useState } from 'react'
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
import { useLogout } from './components/PasswordGate'

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

function groupIndexOf(tab: TabId): number {
  return navGroups.findIndex(g => g.items.some(i => i.id === tab))
}

export default function App() {
  const logout = useLogout()
  const [tab, setTab] = useState<TabId>('timetable')
  const [openGroup, setOpenGroup] = useState<number>(groupIndexOf('timetable'))
  const [zoom, setZoom] = useState(loadZoom)
  const Page = pages[tab]

  const handleGroupClick = (gi: number, group: NavGroup) => {
    if (group.items.length === 1) {
      setTab(group.items[0].id)
      setOpenGroup(gi)
    } else {
      setOpenGroup(openGroup === gi ? -1 : gi)
    }
  }

  const handleTabClick = (id: TabId, gi: number) => {
    setTab(id)
    setOpenGroup(gi)
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
    <div className="print-reset flex h-screen">
      <nav className="w-20 bg-ink flex flex-col items-center py-4 shrink-0 print:hidden overflow-y-auto">
        <div className="flex flex-col gap-1 w-full px-1.5">
          {navGroups.map((group, gi) => {
            const isOpen = openGroup === gi
            const isActiveGroup = group.items.some(i => i.id === tab)
            const isSingle = group.items.length === 1

            return (
              <div key={gi}>
                <button
                  onClick={() => handleGroupClick(gi, group)}
                  className={`w-full h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border-none
                    ${isSingle && isActiveGroup
                      ? 'bg-bg text-ink'
                      : isActiveGroup
                        ? 'bg-bg/20 text-bg'
                        : 'bg-transparent text-bg/60 hover:bg-bg/10 hover:text-bg'
                    }`}
                >
                  <span className="text-base">{group.icon}</span>
                  <span className="text-[9px] leading-tight font-semibold flex items-center gap-0.5">
                    {group.label}
                    {!isSingle && <span className="text-[8px] opacity-60">{isOpen ? '▴' : '▾'}</span>}
                  </span>
                </button>

                {!isSingle && isOpen && (
                  <div className="flex flex-col gap-0.5 mt-0.5 mb-1">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id, gi)}
                        className={`w-full h-8 rounded-lg text-[9px] font-semibold transition-all cursor-pointer border-none
                          ${tab === item.id
                            ? 'bg-bg text-ink'
                            : 'bg-bg/10 text-bg/60 hover:bg-bg/15 hover:text-bg'
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 pt-2">
          <button
            onClick={() => { setTab('settings'); setOpenGroup(-1) }}
            className={`w-16 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border-none
              ${tab === 'settings' ? 'bg-bg text-ink' : 'bg-transparent text-bg/60 hover:bg-bg/10 hover:text-bg'}`}
          >
            <span className="text-base">⚙️</span>
            <span className="text-[9px] leading-tight font-semibold">설정</span>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => changeZoom(-ZOOM_STEP)}
              className="w-7 h-7 rounded-lg bg-bg/10 text-bg/60 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-sm font-bold">
              -
            </button>
            <span className="text-[9px] text-bg/40 w-7 text-center">{Math.round(zoom * 100)}</span>
            <button onClick={() => changeZoom(ZOOM_STEP)}
              className="w-7 h-7 rounded-lg bg-bg/10 text-bg/60 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-sm font-bold">
              +
            </button>
          </div>
          <button onClick={logout}
            className="w-14 h-7 rounded-lg bg-bg/10 text-bg/50 hover:bg-bg/20 hover:text-bg border-none cursor-pointer text-[9px] font-semibold">
            로그아웃
          </button>
          <span className="text-[7px] text-bg/30 leading-tight text-center break-all px-1">{__BUILD_VERSION__}</span>
        </div>
      </nav>

      <main className="print-reset flex-1 flex justify-center items-start overflow-auto p-8">
        <div className="print-reset origin-top" style={{ zoom }}>
          {!noPrintButton.has(tab) && <PrintButton />}
          <Page />
        </div>
      </main>
    </div>
    </>
  )
}
