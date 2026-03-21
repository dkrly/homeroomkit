import { useState } from 'react'
import StudentsTab from './settings/StudentsTab'
import RolesTab from './settings/RolesTab'
import SeatingTab from './settings/SeatingTab'
import BingoTab from './settings/BingoTab'
import ResetTab from './settings/ResetTab'

const settingsTabs = [
  { id: 'students', label: '우리반 학생' },
  { id: 'roles', label: '우리반 역할' },
  { id: 'seating', label: '우리반 자리' },
  { id: 'bingo', label: '친구탐험' },
  { id: 'reset', label: '초기화' },
] as const

type SettingsTab = (typeof settingsTabs)[number]['id']

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('students')

  return (
    <div className="w-[794px] max-w-full">
      <div className="flex gap-1 mb-6 border-b-2 border-border">
        {settingsTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-none cursor-pointer transition-colors rounded-t-lg
              ${tab === t.id ? 'bg-bg text-ink border-b-2 border-ink -mb-[2px]' : 'bg-transparent text-ink/40 hover:text-ink/70'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'students' && <StudentsTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'seating' && <SeatingTab />}
      {tab === 'bingo' && <BingoTab />}
      {tab === 'reset' && <ResetTab />}
    </div>
  )
}
