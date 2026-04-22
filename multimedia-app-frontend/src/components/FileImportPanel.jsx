function FileImportPanel({ onImportFromPaths, onClearLibrary, onAnalyzeAll, stats, searchQuery, onSearchChange }) {
  const handleImportClick = async (mode) => {
    if (!window.electronAPI?.selectPaths) {
      window.alert('Electron API not available (are you running in Electron dev mode?)')
      return
    }
    const paths = await window.electronAPI.selectPaths({ mode })
    if (!paths || paths.length === 0) return
    onImportFromPaths(paths)
  }

  return (
    <section className="import-panel">
      <div className="import-controls">
        <button className="import-button" onClick={() => handleImportClick('folders')}>
          Import Folder
        </button>

        <button className="import-button" onClick={() => handleImportClick('files')}>
          Import Files
        </button>

        <button className="import-button" onClick={onAnalyzeAll}>
          Analyze all
        </button>

        <button
          className="import-button"
          style={{ background: '#d9534f' }}
          onClick={onClearLibrary}
        >
          Clear Library
        </button>
      </div>

      <div className="import-search">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="import-stats">
        <span>Total: {stats.total}</span>
        <span>Images: {stats.images}</span>
        <span>Videos: {stats.videos}</span>
        <span>Audio: {stats.audios}</span>
      </div>
    </section>
  )
}

export default FileImportPanel
