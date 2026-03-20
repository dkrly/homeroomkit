import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { hashPassword, decryptStudents } from '../utils/crypto'
import { initStore } from '../store'
import type { Student } from '../store'

const SESSION_KEY = 'homeroomkit-authed'

const LogoutContext = createContext<() => void>(() => {})
export const useLogout = () => useContext(LogoutContext)

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'locked' | 'unlocked'>('checking')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const savedPw = sessionStorage.getItem(SESSION_KEY)
    if (savedPw) {
      unlock(savedPw)
    } else {
      setState('locked')
    }
  }, [])

  async function unlock(password: string) {
    try {
      const hash = await hashPassword(password)
      if (hash !== __PASSWORD_HASH__) {
        setError('비밀번호가 틀렸습니다')
        setState('locked')
        return
      }

      const resp = await fetch(import.meta.env.BASE_URL + 'data/students.enc')
      if (!resp.ok) throw new Error('학생 데이터를 불러올 수 없습니다')
      const buf = await resp.arrayBuffer()
      const json = await decryptStudents(buf, password)
      const students: Student[] = JSON.parse(json)

      initStore(students)
      sessionStorage.setItem(SESSION_KEY, password)
      setState('unlocked')
    } catch (e) {
      setError(e instanceof Error ? e.message : '복호화 실패')
      setState('locked')
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setState('locked')
    setInput('')
    setError('')
  }

  if (state === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#F6F7F2' }}>
        <div style={{ color: '#1E2A1E', opacity: 0.4 }}>Loading...</div>
      </div>
    )
  }

  if (state === 'locked') {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#F6F7F2' }}>
        <div className="rounded-2xl p-8 w-80" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h1 className="text-xl font-black mb-1" style={{ color: '#1E2A1E' }}>담임 운영 키트</h1>
          <p className="text-sm mb-4" style={{ color: '#1E2A1E', opacity: 0.5 }}>비밀번호를 입력하세요</p>
          <form onSubmit={e => { e.preventDefault(); unlock(input) }}>
            <input
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError('') }}
              className="w-full px-3 py-2 rounded-lg text-sm mb-2"
              style={{ border: '1px solid #ddd', outline: 'none' }}
              placeholder="비밀번호"
              autoFocus
            />
            {error && <p className="text-xs mb-2" style={{ color: '#e74c3c' }}>{error}</p>}
            <button type="submit"
              className="w-full py-2 rounded-lg font-bold text-sm border-none cursor-pointer"
              style={{ background: '#1E2A1E', color: '#F6F7F2' }}>
              확인
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <LogoutContext.Provider value={logout}>{children}</LogoutContext.Provider>
}
