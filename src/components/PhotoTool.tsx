import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppData, setData } from '../store'
import PageHeader from './PageHeader'
import * as faceapi from 'face-api.js'
import JSZip from 'jszip'

const NEIS = { w: 600, h: 800, quality: 0.92 }
const ID = { w: 1240, h: 1653, quality: 0.92 }
const MAX_SIZE = 200 * 1024

interface ProcessedEntry {
  num: number
  name: string
  matched: boolean
  origSize: number
  origW: number
  origH: number
  neis: { name: string; blob: Blob; url: string }
  id: { name: string; blob: Blob; url: string }
}

// --- Face detection (face-api.js) ---
let faceModelLoaded = false
let faceModelLoading = false

async function loadFaceModel() {
  if (faceModelLoaded || faceModelLoading) return
  faceModelLoading = true
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(import.meta.env.BASE_URL + 'models')
    faceModelLoaded = true
  } catch (e) {
    console.warn('Face model load failed:', e)
  }
  faceModelLoading = false
}

async function detectFaceCenter(img: HTMLImageElement) {
  if (!faceModelLoaded) return null
  try {
    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }))
    if (detection) {
      const box = detection.box
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    }
  } catch {}
  return null
}

function smartCrop(img: HTMLImageElement, tw: number, th: number, face: { x: number; y: number } | null) {
  const srcRatio = img.width / img.height
  const dstRatio = tw / th
  let sw: number, sh: number, sx: number, sy: number

  if (srcRatio > dstRatio) { sh = img.height; sw = sh * dstRatio }
  else { sw = img.width; sh = sw / dstRatio }

  if (face) {
    sx = Math.max(0, Math.min(face.x - sw / 2, img.width - sw))
    // 얼굴 중심을 crop 영역의 40% 지점에 배치 (머리 위 여백 확보)
    sy = Math.max(0, Math.min(face.y - sh * 0.4, img.height - sh))
  } else {
    sx = (img.width - sw) / 2
    // 증명사진은 보통 얼굴이 상단에 위치 → 상단 30% 기준
    sy = Math.max(0, (img.height - sh) * 0.3)
  }
  return { sx, sy, sw, sh }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality)
  })
}

async function cropAndEncode(img: HTMLImageElement, face: { x: number; y: number } | null, preset: typeof NEIS) {
  const canvas = document.createElement('canvas')
  canvas.width = preset.w
  canvas.height = preset.h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, preset.w, preset.h)
  const { sx, sy, sw, sh } = smartCrop(img, preset.w, preset.h, face)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, preset.w, preset.h)

  let quality = preset.quality
  let blob = await canvasToBlob(canvas, quality)
  while (blob.size > MAX_SIZE && quality > 0.3) {
    quality -= 0.05
    blob = await canvasToBlob(canvas, quality)
  }
  return blob
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function parseFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, '')
  const neisMatch = base.match(/^(.+)\((\d+)\)$/)
  if (neisMatch) return { name: neisMatch[1].trim(), num: parseInt(neisMatch[2]) }
  const idMatch = base.match(/^\d+-\d+-(\d+)\s+(.+)$/)
  if (idMatch) return { name: idMatch[2].trim(), num: parseInt(idMatch[1]) }
  const numMatch = base.match(/^(\d+)$/)
  if (numMatch) return { name: null, num: parseInt(numMatch[1]) }
  return null
}

function fmt(bytes: number) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1048576).toFixed(1) + 'MB'
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
}

export default function PhotoTool() {
  const { students, grade: savedGrade, classNum: savedClassNum } = useAppData()
  const [grade, setGrade] = useState(savedGrade || 1)
  const [classNum, setClassNum] = useState(savedClassNum || 1)
  const [results, setResults] = useState<ProcessedEntry[]>([])
  const [progress, setProgress] = useState(-1) // -1 = hidden
  const [stats, setStats] = useState('')
  const [faceReady, setFaceReady] = useState(faceModelLoaded)
  const [faceEnabled, setFaceEnabled] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFaceModel().then(() => setFaceReady(faceModelLoaded))
  }, [])

  const saveClassInfo = useCallback((g: number, c: number) => {
    setGrade(g)
    setClassNum(c)
    setData({ grade: g, classNum: c })
  }, [])

  const handleFiles = useCallback(async (fileList: FileList) => {
    const files = [...fileList].filter(f => f.type.startsWith('image/')).sort((a, b) =>
      a.name.localeCompare(b.name, 'ko', { numeric: true })
    )
    if (!files.length) return

    setResults([])
    setProgress(0)

    const processed: ProcessedEntry[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const img = await loadImage(file)
        const face = faceEnabled ? await detectFaceCenter(img) : null
        const neisBlob = await cropAndEncode(img, face, NEIS)
        const idBlob = await cropAndEncode(img, face, ID)

        const parsed = parseFilename(file.name)
        let num: number, name: string, matched: boolean

        if (parsed) {
          const student = students.find(s => s.num === parsed.num)
          if (student) {
            num = student.num; name = student.name; matched = true
          } else if (parsed.name) {
            num = parsed.num; name = parsed.name; matched = false
          } else {
            num = parsed.num; name = `학생${parsed.num}`; matched = false
          }
        } else {
          num = i + 1; name = file.name.replace(/\.[^.]+$/, ''); matched = false
        }

        const entry: ProcessedEntry = {
          num, name, matched,
          origSize: file.size, origW: img.width, origH: img.height,
          neis: { name: `${name}(${num}).jpg`, blob: neisBlob, url: URL.createObjectURL(neisBlob) },
          id: { name: `${grade}-${classNum}-${num} ${name}.jpg`, blob: idBlob, url: URL.createObjectURL(idBlob) },
        }
        processed.push(entry)
      } catch (err) {
        console.error('Failed:', file.name, err)
      }
      setProgress((i + 1) / files.length * 100)
    }

    setResults(processed)
    const neisTotal = processed.reduce((s, r) => s + r.neis.blob.size, 0)
    const idTotal = processed.reduce((s, r) => s + r.id.blob.size, 0)
    setStats(
      `${processed.length}장 처리 완료 · 나이스 총 ${fmt(neisTotal)} · 학생증 총 ${fmt(idTotal)}` +
      (faceEnabled && faceModelLoaded ? ' · 얼굴 감지 ON' : ' · 얼굴 감지 OFF')
    )
    setProgress(-1)
  }, [students, grade, classNum, faceEnabled])

  const downloadZip = useCallback(async () => {
    if (!results.length) return
    const today = new Date().toISOString().slice(0, 10)
    const zip = new JSZip()
    const neisFolder = zip.folder('나이스')!
    const idFolder = zip.folder('학생증')!
    for (const r of results) {
      neisFolder.file(r.neis.name, r.neis.blob)
      idFolder.file(r.id.name, r.id.blob)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    download(blob, `증명사진_${grade}-${classNum}_${today}.zip`)
  }, [results, grade, classNum])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handlePrint = useCallback(() => {
    const origTitle = document.title
    document.title = `증명사진_${grade}-${classNum}`
    window.print()
    document.title = origTitle
  }, [grade, classNum])

  // 인쇄용: 학생 수에 따라 그리드 자동 계산, 무조건 1페이지
  const count = results.length
  const PRINT_COLS = count <= 20 ? 4 : 5
  const PRINT_ROWS = Math.ceil(count / PRINT_COLS)

  return (
    <>
    {/* 인쇄 전용 레이아웃 */}
    {results.length > 0 && (
      <div className="page photo-print-page" style={{ display: 'none' }}>
        <style>{`
          @media print {
            .photo-print-page {
              height: 100vh !important;
              overflow: hidden !important;
              padding: 24px 20px 16px !important;
            }
            .photo-print-page .photo-grid {
              flex: 1;
              min-height: 0;
            }
            .photo-print-page .photo-cell img {
              flex: 1;
              min-height: 0;
              width: 100%;
              object-fit: cover;
              border-radius: 3px;
              border: 1px solid #ddd;
            }
          }
        `}</style>
        <PageHeader badge="Photo" title={`${grade}학년 ${classNum}반 증명사진`} />
        <div className="photo-grid" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${PRINT_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${PRINT_ROWS}, 1fr)`,
          gap: 4,
          flex: 1,
          minHeight: 0,
        }}>
          {results.map((entry, i) => (
            <div key={i} className="photo-cell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0, overflow: 'hidden' }}>
              <img src={entry.id.url} alt={entry.name} style={{
                width: '100%', flex: 1, minHeight: 0, objectFit: 'cover',
                borderRadius: 3, border: '1px solid #e5e7eb',
              }} />
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                <span style={{ color: '#888', fontWeight: 600 }}>{entry.num}</span>{' '}{entry.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* 화면 UI */}
    <div className="print:hidden" style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>증명사진 벌크 처리</h2>
      <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: 20 }}>
        사진 선택 → 얼굴 감지 crop → 나이스 + 학생증 ZIP 다운로드
      </p>

      {/* 학급 정보 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>학급 정보</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>학년</label>
          <input type="number" value={grade} min={1} max={6}
            onChange={e => saveClassInfo(parseInt(e.target.value) || 1, classNum)}
            style={{ width: 60, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem' }} />
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>반</label>
          <input type="number" value={classNum} min={1} max={30}
            onChange={e => saveClassInfo(grade, parseInt(e.target.value) || 1)}
            style={{ width: 60, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem' }} />
          <span style={{ fontSize: '0.8rem', color: '#10b981' }}>
            학생 {students.filter(s => s.name).length}명 자동 연동
          </span>
        </div>
      </div>

      {/* 프리셋 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#dbeafe', color: '#2563eb' }}>
            나이스: 600x800px JPEG 92%
          </span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#16a34a' }}>
            학생증: 1240x1653px JPEG 92%
          </span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#d97706' }}>
            200KB 이하 자동 조절
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#999' }}>
          나이스 → <b>이름(번호).jpg</b> | 학생증 → <b>학년-반-번호 이름.jpg</b>
        </p>
      </div>

      {/* 얼굴 감지 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>얼굴 감지 크롭</span>
        <button
          onClick={() => faceReady && setFaceEnabled(v => !v)}
          disabled={!faceReady}
          style={{
            position: 'relative', width: 48, height: 26, borderRadius: 13, border: 'none', cursor: faceReady ? 'pointer' : 'default',
            background: !faceReady ? '#e5e7eb' : faceEnabled ? '#3b82f6' : '#d1d5db',
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: faceEnabled ? 25 : 3,
            width: 20, height: 20, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
        <span style={{ fontSize: '0.78rem', color: !faceReady ? '#999' : faceEnabled ? '#3b82f6' : '#999' }}>
          {!faceReady ? '모델 로딩 중...' : faceEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* 드롭 존 */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        style={{
          border: '2px dashed #ccc', borderRadius: 12, padding: 36, textAlign: 'center',
          color: '#aaa', cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s',
        }}
      >
        <p style={{ fontSize: '1.1rem', marginBottom: 6 }}>사진 파일을 드래그하거나 클릭하여 선택</p>
        <p style={{ fontSize: '0.8rem' }}>파일명 자동 인식: 이름(번호).jpg 또는 학년-반-번호 이름.jpg</p>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* 프로그레스 바 */}
      {progress >= 0 && (
        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#3b82f6', transition: 'width 0.15s', width: `${progress}%` }} />
        </div>
      )}

      {stats && <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 12 }}>{stats}</p>}

      {/* 액션 버튼 */}
      {results.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={downloadZip}
            style={{ padding: '10px 20px', border: 'none', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: '#10b981', color: '#fff' }}>
            나이스 + 학생증 ZIP 다운로드
          </button>
          <button onClick={handlePrint}
            style={{ padding: '10px 20px', border: 'none', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: '#1E2A1E', color: '#F6F7F2' }}>
            출석부 인쇄
          </button>
          <button onClick={() => { setResults([]); setStats(''); if (fileRef.current) fileRef.current.value = '' }}
            style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#555' }}>
            초기화
          </button>
        </div>
      )}

      {/* 결과 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {results.map((entry, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 8 }}>
            <img src={entry.id.url} alt={entry.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', background: '#eee' }} />
            <div style={{ fontWeight: 600, fontSize: '0.78rem', marginTop: 4, textAlign: 'center', padding: '0 4px' }}>
              {entry.num}. {entry.name}
            </div>
            {entry.matched
              ? <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>학생 매칭됨</div>
              : <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>매칭 안됨</div>
            }
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 2, textAlign: 'center', padding: '0 4px' }}>
              원본: {entry.origW}x{entry.origH} {fmt(entry.origSize)}
            </div>
            <div style={{ fontSize: '0.7rem', textAlign: 'center', padding: '0 4px' }}>
              나이스{' '}
              <span style={{ color: entry.neis.blob.size > MAX_SIZE ? '#ef4444' : '#888', fontWeight: entry.neis.blob.size > MAX_SIZE ? 700 : 400 }}>
                {fmt(entry.neis.blob.size)}
              </span>
              {' · '}학생증{' '}
              <span style={{ color: entry.id.blob.size > MAX_SIZE ? '#ef4444' : '#888', fontWeight: entry.id.blob.size > MAX_SIZE ? 700 : 400 }}>
                {fmt(entry.id.blob.size)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}
