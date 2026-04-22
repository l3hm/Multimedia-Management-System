import AudioPlayer from './AudioPlayer'
import VideoPlayer from './VideoPlayer'
import ImageViewer from './ImageViewer'

function BottomPlayerBar({ current, isPlaying, onResume, onStop, onEnded }) {
  if (!current) return null

  return (
    <div className="bottom-player">
      <div className="bottom-player__meta">
        <div className="bottom-player__title" title={current.name}>
          {current.name}
        </div>
        <div className="bottom-player__subtitle">
          {current.type?.toUpperCase()} {current.tags?.length ? `· ${current.tags.join(', ')}` : ''}
        </div>
      </div>

      <div className="bottom-player__center">
        <div className="bottom-player__content">
          {current.type === 'audio' && (
            <AudioPlayer src={current.url} isPlaying={isPlaying} onEnded={onEnded} />
          )}
          {current.type === 'video' && (
            <VideoPlayer src={current.url} isPlaying={isPlaying} onEnded={onEnded} />
          )}
          {current.type === 'image' && <ImageViewer src={current.url} />}
          {current.type === 'other' && (
            <div className="bottom-player__note">No player for this file type yet.</div>
          )}
        </div>
      </div>

      <div className="bottom-player__controls">
        {!isPlaying && (
          <button className="bottom-player__btn bottom-player__btn--primary" onClick={onResume}>
            Play
          </button>
        )}
        <button className="bottom-player__btn bottom-player__btn--danger" onClick={onStop}>
          Stop
        </button>
      </div>
    </div>
  )
}

export default BottomPlayerBar
