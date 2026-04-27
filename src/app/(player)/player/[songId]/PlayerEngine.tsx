'use client'
import { useEffect } from 'react'
import { HTML5AudioAdapter } from '@/lib/adapters/HTML5AudioAdapter'
import { SyncEngine } from '@/lib/engine/SyncEngine'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { useSyncStore } from '@/lib/stores/useSyncStore'
import { useSongStore } from '@/lib/stores/useSongStore'

interface Props {
  audioSrc: string
}

export function PlayerEngine({ audioSrc }: Props) {
  const setBridge = usePlayerStore(s => s.setBridge)
  const setPlayerState = usePlayerStore(s => s.setState)
  const setDuration = usePlayerStore(s => s.setDuration)
  const setSync = useSyncStore(s => s.setSync)
  const words = useSongStore(s => s.lyrics?.words ?? [])
  const lineForWord = useSongStore(s => s.lineForWord)

  useEffect(() => {
    if (!words.length) return

    const bridge = new HTML5AudioAdapter(audioSrc)
    setBridge(bridge)

    const unsubPlay     = bridge.on('play',           () => setPlayerState('playing'))
    const unsubPause    = bridge.on('pause',          () => setPlayerState('paused'))
    const unsubError    = bridge.on('error',          () => setPlayerState('error'))
    const unsubDuration = bridge.on('durationchange', () => setDuration(bridge.getDuration()))

    const engine = new SyncEngine(bridge, words, lineForWord)
    const unsubSync = engine.subscribe(({ activeWordIndex, activeLineIndex }) => {
      setSync(activeWordIndex, activeLineIndex)
    })
    engine.start()

    return () => {
      unsubSync()
      engine.destroy()
      bridge.destroy()
      unsubPlay()
      unsubPause()
      unsubError()
      unsubDuration()
    }
  }, [audioSrc, words, lineForWord, setBridge, setDuration, setPlayerState, setSync])

  return null
}
