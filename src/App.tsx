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

const tabs = [
  { id: 'students', label: '학생', icon: '👥' },
  { id: 'timetable', label: '1학년2반', icon: '📋' },
  { id: 'teacher', label: '정보', icon: '🧑‍🏫' },
  { id: 'schedule', label: '일과운영표', icon: '⏰' },
  { id: 'role', label: '1인1역', icon: '🎲' },
  { id: 'role1', label: '우리반 역할', icon: '📋' },
  { id: 'seating', label: '자리배치', icon: '💺' },
  { id: 'seating1', label: '우리반 자리', icon: '🪑' },
  { id: 'bingo', label: '친구탐험', icon: '🔍' },
  { id: 'combo', label: '시간+일과', icon: '🖨️' },
] as const

type TabId = (typeof tabs)[number]['id'] | 'settings'

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
  settings: Settings,
}

const noPrintButton = new Set<TabId>(['role', 'role1', 'seating', 'seating1', 'bingo', 'settings'])

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
  const [zoom, setZoom] = useState(loadZoom)
  const Page = pages[tab]

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
      <nav className="w-20 bg-ink flex flex-col items-center py-6 shrink-0 print:hidden">
        <div className="flex flex-col gap-2">
          {tabs.map(t => <NavBtn key={t.id} active={tab === t.id} icon={t.icon} label={t.label} onClick={() => setTab(t.id)} />)}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <NavBtn active={tab === 'settings'} icon="⚙️" label="설정" onClick={() => setTab('settings')} />
          <div className="flex items-center gap-1 mt-2">
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
          <span className="text-[8px] text-bg/30 leading-tight text-center break-all px-1">{__BUILD_VERSION__}</span>
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

function NavBtn({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all cursor-pointer border-none
        ${active ? 'bg-bg text-ink' : 'bg-transparent text-bg/60 hover:bg-bg/10 hover:text-bg'}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] leading-tight">{label}</span>
    </button>
  )
}
