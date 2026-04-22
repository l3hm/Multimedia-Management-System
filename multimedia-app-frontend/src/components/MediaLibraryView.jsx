import FileImportPanel from './FileImportPanel'
import MediaList from './MediaList'

function MediaLibraryView({
  items,
  onImportFromPaths,
  onClearLibrary,
  onAnalyzeAll,
  stats,
  loading,
  onEditMetadata,
  onRunAiAnalysis,
  onOpenRecommendations,
  onPlay,
  onDeleteMedia,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="media-library">
      <FileImportPanel
        onImportFromPaths={onImportFromPaths}
        onClearLibrary={onClearLibrary}
        onAnalyzeAll={onAnalyzeAll}
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      {loading ? ( <p className="empty-state">Loading library…</p> ) : (
        <MediaList
          items={items}
          onEditMetadata={onEditMetadata}
          onRunAiAnalysis={onRunAiAnalysis}
          onOpenRecommendations={onOpenRecommendations}
          onPlay={onPlay}
          onDeleteMedia={onDeleteMedia}
        />
      )}
    </div>
  )
}

export default MediaLibraryView
