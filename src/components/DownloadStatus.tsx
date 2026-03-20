import { useState, useEffect } from 'react'
import { getJobs, subscribe, type DownloadJob } from '../utils/downloadQueue'

export default function DownloadStatus() {
  const [jobs, setJobs] = useState<DownloadJob[]>(getJobs())

  useEffect(() => subscribe(() => setJobs([...getJobs()])), [])

  if (jobs.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 print:hidden">
      {jobs.map(job => (
        <div key={job.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg text-[12px] font-semibold"
          style={{ background: '#1E2A1E', color: '#F6F7F2', minWidth: 180 }}>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span>{job.label}</span>
              <span className="text-[10px] opacity-60">
                {job.phase === 'queued' ? '대기'
                  : job.phase === 'capturing' ? `${Math.round(job.progress)}%`
                  : job.phase === 'done' ? '완료!'
                  : '오류'}
              </span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(246,247,242,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${job.progress}%`,
                  background: job.phase === 'done' ? '#4E9B7E' : job.phase === 'error' ? '#e74c3c' : '#F6F7F2',
                }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
