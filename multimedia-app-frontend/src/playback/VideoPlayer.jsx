import { useEffect, useRef } from 'react'

function VideoPlayer({ src, isPlaying, onEnded }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    if (isPlaying) ref.current.play().catch(() => {})
    else ref.current.pause()
  }, [isPlaying, src])

  return (
    <video ref={ref} src={src} controls onEnded={onEnded}
      style={{ width: '100%', maxHeight: 240, borderRadius: 10, display: 'block' }}
    />
  )
}

export default VideoPlayer
