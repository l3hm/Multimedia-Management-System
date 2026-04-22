import { useCallback, useState } from 'react'

const API_BASE = 'http://localhost:8000'

export function usePlayback() {
  const [current, setCurrent] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const playItem = useCallback((item) => {
    if (!item?.id) {
      window.alert('No media id available.')
      return
    }

    const url = `${API_BASE}/media/${encodeURIComponent(item.id)}`
    setCurrent({ ...item, url })
    setIsPlaying(true)
  }, [])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setCurrent(null)
  }, [])

  const pause = useCallback(() => setIsPlaying(false), [])
  const resume = useCallback(() => setIsPlaying(true), [])

  return {
    current,
    isPlaying,
    playItem,
    stop,
    pause,
    resume,
    setIsPlaying,
  }
}