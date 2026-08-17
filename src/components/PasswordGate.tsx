import { useState } from 'react'
import { hashPassword, decryptStudents } from '../utils/crypto'
import { setData } from '../store'
import type { Student } from '../store'

export function LoadPreset() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLoad() {
    setError('')
    setLoading(true)
    try {
      const hash = await hashPassword(input)
      if (hash !== __PASSWORD_HASH__) {
        setError('비밀번호가 틀렸습니다')
        setLoading(false)
        return
      }
      const resp = await fetch(import.meta.env.BASE_URL + 'data/students.enc')
      if (!resp.ok) throw new Error('데이터를 불러올 수 없습니다')
      const buf = await resp.arrayBuffer()
      const json = await decryptStudents(buf, input)
      const students: Student[] = JSON.parse(json)
      setData({ students })
      setOpen(false)
      setInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '복호화 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg font-bold text-sm border-none cursor-pointer"
        style={{ background: '#1E2A1E', color: '#F6F7F2' }}>
        프리셋 불러오기
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        value={input}
        onChange={e => { setInput(e.target.value); setError('') }}
        className="px-3 py-2 rounded-lg text-sm w-48"
        style={{ border: '1px solid #ddd', outline: 'none' }}
        placeholder="비밀번호"
        autoFocus
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setInput(''); setError('') } }}
      />
      <button onClick={handleLoad} disabled={loading}
        className="px-4 py-2 rounded-lg font-bold text-sm border-none cursor-pointer disabled:opacity-50"
        style={{ background: '#1E2A1E', color: '#F6F7F2' }}>
        {loading ? '...' : '확인'}
      </button>
      <button onClick={() => { setOpen(false); setInput(''); setError('') }}
        className="px-3 py-2 rounded-lg text-sm border-none cursor-pointer"
        style={{ background: '#eee', color: '#666' }}>
        취소
      </button>
      {error && <span className="text-xs" style={{ color: '#e74c3c' }}>{error}</span>}
    </div>
  )
}
