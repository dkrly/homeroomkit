import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { hashPassword, decryptStudents } from '../utils/crypto'
import { initStore } from '../store'
import type { Student } from '../store'

const SESSION_KEY = 'homeroomkit-authed'

interface AuthState {
  authed: boolean
  checking: boolean
  login: (password: string) => Promise<void>
  logout: () => void
  error: string
}

const AuthContext = createContext<AuthState>({
  authed: false,
  checking: true,
  login: async () => {},
  logout: () => {},
  error: '',
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedPw = sessionStorage.getItem(SESSION_KEY)
    if (savedPw) {
      unlock(savedPw).finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [])

  async function unlock(password: string) {
    const hash = await hashPassword(password)
    if (hash !== __PASSWORD_HASH__) {
      setError('비밀번호가 틀렸습니다')
      setAuthed(false)
      return
    }

    const resp = await fetch(import.meta.env.BASE_URL + 'data/students.enc')
    if (!resp.ok) throw new Error('학생 데이터를 불러올 수 없습니다')
    const buf = await resp.arrayBuffer()
    const json = await decryptStudents(buf, password)
    const students: Student[] = JSON.parse(json)

    initStore(students)
    sessionStorage.setItem(SESSION_KEY, password)
    setAuthed(true)
    setError('')
  }

  async function login(password: string) {
    setError('')
    try {
      await unlock(password)
    } catch (e) {
      setError(e instanceof Error ? e.message : '복호화 실패')
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
    setError('')
  }

  return (
    <AuthContext.Provider value={{ authed, checking, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function LoginForm() {
  const { login, error } = useAuth()
  const [input, setInput] = useState('')

  return (
    <div className="flex items-center justify-center py-20">
      <div className="rounded-2xl p-8 w-80" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#1E2A1E' }}>로그인 필요</h2>
        <p className="text-sm mb-4" style={{ color: '#1E2A1E', opacity: 0.5 }}>학생 데이터를 사용하는 기능입니다</p>
        <form onSubmit={e => { e.preventDefault(); login(input) }}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value) }}
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
