import { useEffect, useRef } from 'react'

function AudioPlayer({ src, isPlaying, onEnded }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    if (isPlaying) ref.current.play().catch(() => {})
    else ref.current.pause()
  }, [isPlaying, src])

  return (
    <audio ref={ref} src={src} controls onEnded={onEnded}
      style={{ width: '100%', display: 'block' }}
    />
  )
}

export default AudioPlayer