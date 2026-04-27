'use client'
import { useCallback, useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Pause, Play } from 'lucide-react'

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function PlayerControls() {
  const bridge = usePlayerStore(s => s.bridge)
  const state = usePlayerStore(s => s.state)
  const duration_ms = usePlayerStore(s => s.duration_ms)
  const play = usePlayerStore(s => s.play)
  const pause = usePlayerStore(s => s.pause)
  const seek = usePlayerStore(s => s.seek)
  const [currentMs, setCurrentMs] = useState(0)

  useEffect(() => {
    if (!bridge || state !== 'playing') return
    const id = setInterval(() => setCurrentMs(bridge.getCurrentTime()), 250)
    return () => clearInterval(id)
  }, [bridge, state])

  const handleSliderChange = useCallback((values: number | readonly number[]) => {
    const ms = Array.isArray(values) ? values[0] : values
    setCurrentMs(ms)
    seek(ms)
  }, [seek])

  const isPlaying = state === 'playing'

  return (
    <div className="flex flex-col gap-3 w-full px-4 py-4 bg-slate-900 border-t border-slate-800">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 w-10 text-right tabular-nums">
          {formatTime(currentMs)}
        </span>
        <Slider
          min={0}
          max={duration_ms || 1}
          value={[currentMs]}
          onValueChange={handleSliderChange}
          className="flex-1"
          aria-label="Seek"
        />
        <span className="text-xs text-slate-500 w-10 tabular-nums">
          {formatTime(duration_ms)}
        </span>
      </div>
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="h-10 w-10 text-slate-200 hover:text-white hover:bg-slate-800"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  )
}
