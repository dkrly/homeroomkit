import { useState, useEffect } from 'react'
import { getJobs, subscribe, type DownloadJob } from '../utils/downloadQueue'

export default function DownloadPage() {
  const [jobs, setJobs] = useState<DownloadJob[]>(getJobs())

  useEffect(() => subscribe(() => setJobs([...getJobs()])), [])

  return (
    <div className="w-[794px] max-w-full">
      <h1 className="text-2xl font-black text-ink mb-6">처리 현황</h1>

      {jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-ink/40 text-sm">다운로드 대기 중인 항목이 없습니다</p>
          <p className="text-ink/30 text-xs mt-1">각 페이지에서 다운로드 버튼을 누르면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

function JobCard({ job }: { job: DownloadJob }) {
  const statusColor = job.phase === 'done' ? '#4E9B7E'
    : job.phase === 'error' ? '#e74c3c'
    : '#1E2A1E'

  const statusLabel = job.phase === 'queued' ? '대기 중'
    : job.phase === 'capturing' ? `생성 중 ${Math.round(job.progress)}%`
    : job.phase === 'done' ? '완료'
    : '오류'

  return (
    <div className="rounded-xl p-4 flex items-center gap-4"
      style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
      <div className="w-10 h-10 rounded-lg grid place-items-center text-lg"
        style={{
          background: job.phase === 'done' ? '#E2EFEA'
            : job.phase === 'error' ? '#FEF2F2'
            : '#F3F4F6',
        }}>
        {job.phase === 'done' ? '✓' : job.phase === 'error' ? '✕' : '⏳'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink truncate">{job.label}</span>
          <span className="text-xs font-semibold shrink-0 ml-2" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${job.progress}%`, background: statusColor }} />
        </div>
      </div>
    </div>
  )
}
