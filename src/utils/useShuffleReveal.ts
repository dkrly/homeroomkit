import { useState, useRef, useCallback, useEffect } from 'react'
import { startShuffleLoop, playReveal } from './sound'

type Phase = 'ready' | 'spinning' | 'stopping' | 'done'

interface ShuffleRevealOptions {
  itemCount: number
  revealInterval?: number
  onAllRevealed?: () => void
}

export function useShuffleReveal({ itemCount, revealInterval = 200, onAllRevealed }: ShuffleRevealOptions) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [stoppedUpTo, setStoppedUpTo] = useState(-1)
  const timerRef = useRef<number>(0)
  const stopLoopRef = useRef<(() => void) | null>(null)

  const startSpin = useCallback(() => {
    setPhase('spinning')
    setStoppedUpTo(-1)
    stopLoopRef.current = startShuffleLoop()
  }, [])

  const stopSpin = useCallback(() => {
    setPhase('stopping')
    stopLoopRef.current?.()
    stopLoopRef.current = null

    let current = 0
    playReveal()
    setStoppedUpTo(current)
    current++
    timerRef.current = window.setTimeout(function revealNext() {
      if (current < itemCount) {
        playReveal()
        setStoppedUpTo(current)
        current++
        timerRef.current = window.setTimeout(revealNext, revealInterval)
      } else {
        setTimeout(() => {
          setPhase('done')
          onAllRevealed?.()
        }, revealInterval)
      }
    }, revealInterval)
  }, [itemCount, revealInterval, onAllRevealed])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    stopLoopRef.current?.()
    stopLoopRef.current = null
    setPhase('ready')
    setStoppedUpTo(-1)
  }, [])

  const finishImmediately = useCallback(() => {
    setStoppedUpTo(itemCount)
    setPhase('done')
  }, [itemCount])

  useEffect(() => () => {
    clearTimeout(timerRef.current)
    stopLoopRef.current?.()
  }, [])

  return { phase, stoppedUpTo, startSpin, stopSpin, reset, finishImmediately }
}
