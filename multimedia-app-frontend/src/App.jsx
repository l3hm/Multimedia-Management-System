import { useState, useEffect, useMemo } from 'react'
import './App.css'
import MediaLibraryView from './components/MediaLibraryView'
import BottomPlayerBar from './playback/BottomPlayerBar'
import { usePlayback } from './playback/usePlayback'
import { ANALYSIS_CONFIG } from './config/analysisConfig'
import MetadataModal from './components/MetadataModal'
import RecommendationModal from './components/RecommendaitonModal'

const API_BASE = 'http://localhost:8000'

const PROVIDER_BY_TYPE = {
  image: 'imagga',
  audio: 'cyanite',
  // video: 'futureProvider'
}

function App() {
  const [mediaItems, setMediaItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [metadataItem, setMetadataItem] = useState(null)
  const playback = usePlayback()
  const [searchQuery, setSearchQuery] = useState('')
  const [recommendOpen, setRecommendOpen] = useState(false)
  const [recommendFor, setRecommendFor] = useState(null)
  const [recommendItems, setRecommendItems] = useState([])

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const res = await fetch(`${API_BASE}/library`)
        if (!res.ok) throw new Error('Failed to load library')
        const data = await res.json()
        setMediaItems(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadLibrary()
  }, [])

  const handleImportFromPaths = async (paths) => {
    if (!paths || paths.length === 0) return

    try {
      const res = await fetch(`${API_BASE}/library/import-from-paths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })

      if (!res.ok) throw new Error('Failed to import from paths')

      const data = await res.json()

      if (data.added && data.added.length > 0) {
        setMediaItems((prev) => [...prev, ...data.added])
      }

      if (data.duplicates && data.duplicates.length > 0) {
        const names = data.duplicates.map((item) => item.name)
        window.alert(
          `The following item(s) are already imported:\n\n${names.join('\n')}`
        )
      }
    } catch (err) {
      console.error(err)
      window.alert('Failed to import from paths.')
    }
  }

  const handleClearLibrary = async () => {
    const confirmed = window.confirm("Are you sure you want to clear the entire library?")
    if (!confirmed) return

    try {
      const res = await fetch(`${API_BASE}/library/clear`, {
        method: 'POST'
      })

      if (!res.ok) throw new Error("Failed to clear library")

      setMediaItems([])
    } catch (err) {
      console.error(err)
      window.alert("Failed to clear library.")
    }
  }

  const stats = useMemo(() => {
    const total = mediaItems.length
    const images = mediaItems.filter((m) => m.type === 'image').length
    const videos = mediaItems.filter((m) => m.type === 'video').length
    const audios = mediaItems.filter((m) => m.type === 'audio').length
    return { total, images, videos, audios }
  }, [mediaItems])

  const filteredItems = useMemo(() => {
  if (!searchQuery.trim()) return mediaItems

  const tokens = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  return mediaItems.filter((item) => {
    const name = item.name?.toLowerCase() || ''
    const type = item.type?.toLowerCase() || ''
    const tags = (item.tags || []).map((t) => t.toLowerCase())

    return tokens.every((token) => {
      if (token === type) return true
      if (name.includes(token)) return true
      if (tags.some((t) => t.includes(token))) return true
      return false
    })
  })
}, [mediaItems, searchQuery])

  const handleEditMetadata = (item) => {
    setMetadataItem(item)
    setMetadataOpen(true)
  }

  const handleMetadataSaved = async () => {
    const res = await fetch(`${API_BASE}/library`)
    const data = await res.json()
    setMediaItems(data)
  }

  const handleRunAiAnalysis = async (item) => {
    const provider = PROVIDER_BY_TYPE[item.type]

    if (!provider) {
      window.alert(`AI analysis is not implemented yet for: ${item.type.toUpperCase()}`)
      return
    }

    try {
      const res = await fetch(
        `${API_BASE}/analyze/by-id?provider=${encodeURIComponent(provider)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        }
      )

      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        const detail =
          payload?.detail ? `\n\n${payload.detail}` :
          payload?.message ? `\n\n${payload.message}` : ''
        throw new Error(`Analyze failed (${res.status})${detail}`)
      }

      const data = payload
  
      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? {
                ...m,
                tags: data.tags,
                tagged: true,
                analysisProvider: data.provider,
                analysisModel: data.model,
                analysisFailed: false,
              }
            : m
        )
      )
    } catch (err) {
      console.error(err)
      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? { ...m, analysisFailed: true }
            : m
        )
      )
      window.alert(`AI analysis failed.${err?.message ? `\n\n${err.message}` : ''}`
      )
    }
  }

  const handleOpenRecommendations = async(item) => {
    setRecommendFor(item)
    setRecommendOpen(true)

    try {
      const res = await fetch(
        `${API_BASE}/recommendations/${encodeURIComponent(item.id)}`
      )
      if (!res.ok) throw new Error('Failed to load recommendations')

      const data = await res.json()
      setRecommendItems(data)
    } catch (err) {
      console.error(err)
      setRecommendItems([])
    }
  }

  const handleDeleteMedia = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.name}" from library?\n\nThis will NOT delete the file from disk.`
    )
    if (!confirmed) return

    const res = await fetch(
      `${API_BASE}/library?media_id=${encodeURIComponent(item.id)}`,
      { method: 'DELETE' }
    )

    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      console.error('Delete failed:', msg)
      window.alert('Failed to delete item.')
      return
    }

    setMediaItems((prev) => prev.filter((m) => m.id !== item.id))
  }

  const handleAnalyzeAll = async () => {
  if (!ANALYSIS_CONFIG.enabled) {
    window.alert('AI analysis is currently disabled in configuration.')
    return
  }

  let candidates = mediaItems.filter((item) => {
    if (!ANALYSIS_CONFIG.allowedTypes.includes(item.type)) return false
    if (
      ANALYSIS_CONFIG.skipIfAlreadyAnalyzed &&
      item.tags &&
      item.tags.length > 0
    ) {
      return false
    }
    return true
  })

  if (candidates.length === 0) {
    window.alert('No media items eligible for analysis.')
    return
  }

  candidates.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  if (candidates.length > ANALYSIS_CONFIG.maxItemsPerRun) {
    candidates = candidates.slice(0, ANALYSIS_CONFIG.maxItemsPerRun)
  }

  if (ANALYSIS_CONFIG.confirmBeforeRun) {
    const ok = window.confirm(
      `Analyze ${candidates.length} item(s)?\n\nThis will consume AI tokens.`
    )
    if (!ok) return
  }

  let successCount = 0
  let failedCount = 0
  let skippedCount = 0
  const failedNames = []

  for (const item of candidates) {
    const provider = ANALYSIS_CONFIG.providersByType[item.type]
    if (!provider) {
      skippedCount++
      continue
    }

    try {
      const res = await fetch(
        `${API_BASE}/analyze/by-id?provider=${encodeURIComponent(provider)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        }
      )

      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.detail || 'Analysis failed')

      successCount++
      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? { ...m, tags: payload.tags, tagged: true, analysisFailed: false }
            : m
        )
      )
    } catch (err) {
      failedCount++
      failedNames.push(item.name)
      console.error(`Analysis failed for ${item.name}`, err)
      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? { ...m, analysisFailed: true }
            : m
        )
      )
    }
  }
  let message = `AI analysis completed.\n\nSuccess: ${successCount}\nFailed: ${failedCount}`
  if (skippedCount > 0) {
    message += `\nSkipped: ${skippedCount}`
  }
  if (failedNames.length > 0) {
    message += `\n\nFailed items:\n${failedNames.join('\n')}`
  }
  window.alert(message)
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Multimedia Management and Playback system</h1>
      </header>
      <main className="app-main">
        <MediaLibraryView
          items={filteredItems}
          onImportFromPaths={handleImportFromPaths}
          onClearLibrary={handleClearLibrary}
          stats={stats}
          loading={loading}
          onAnalyzeAll={handleAnalyzeAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onEditMetadata={handleEditMetadata}
          onRunAiAnalysis={handleRunAiAnalysis}
          onOpenRecommendations={handleOpenRecommendations}
          onPlay={playback.playItem}
          onDeleteMedia={handleDeleteMedia}
        />
        <BottomPlayerBar
          current={playback.current}
          isPlaying={playback.isPlaying}
          onResume={playback.resume}
          onStop={playback.stop}
          onEnded={playback.stop}
        />
        <MetadataModal
          open={metadataOpen}
          item={metadataItem}
          onOpenChange={setMetadataOpen}
          apiBase={API_BASE}
          onSaved={handleMetadataSaved}
        />
        <RecommendationModal
          open={recommendOpen}
          onOpenChange={setRecommendOpen}
          baseItem={recommendFor}
          items={recommendItems}
          onPlay={playback.playItem}
        />
      </main>
    </div>
  )
}

export default App
