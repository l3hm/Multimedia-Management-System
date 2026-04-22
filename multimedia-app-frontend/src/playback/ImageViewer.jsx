import { useState, useEffect } from 'react'

function ImageViewer({ src }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <div
        style={{ display: 'flex', justifyContent: 'center', cursor: 'zoom-in' }}
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt=""
          style={{
            maxHeight: 220,
            maxWidth: '100%',
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
        />
      </div>

      {open && (
        <div className="image-lightbox" onClick={() => setOpen(false)}>
          <img
            src={src}
            alt=""
            className="image-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export default ImageViewer