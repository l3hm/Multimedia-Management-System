import FolderNode from './FolderNode'

function normalizePath(p) {
  return (p || '').replaceAll('\\', '/')
}

function trimTrailingSlash(p) {
  return p && p.endsWith('/') ? p.slice(0, -1) : p
}

function basename(p) {
  const n = trimTrailingSlash(normalizePath(p))
  const idx = n.lastIndexOf('/')
  return idx === -1 ? n : n.slice(idx + 1)
}

function getFolderSegments(item) {
  const fullPath = normalizePath(item.absolutePath)
  const importRoot = trimTrailingSlash(normalizePath(item.importRoot))
  const root = importRoot || trimTrailingSlash(dirname(item.absolutePath))

  if (!fullPath || !root || !fullPath.startsWith(root)) {
    return []
  }

  const includeRoot = Boolean(importRoot) && fullPath !== root
  const relative = fullPath.slice(root.length)
  const idx = relative.lastIndexOf('/')

  if (idx === -1) return includeRoot ? [basename(root)] : []

  const segments = relative.slice(0, idx).split('/').filter(Boolean)
  return includeRoot ? [basename(root), ...segments] : segments
}

function createNode(name, fullPath) {
  return {
    name,
    fullPath,
    children: new Map(),
    items: [],
  }
}

function buildFolderTree(items) {
  const root = createNode('ROOT', '')

  for (const item of items) {
    const segments = getFolderSegments(item)

    let current = root
    let runningPath = ''

    for (const seg of segments) {
      runningPath = runningPath ? `${runningPath}/${seg}` : seg

      if (!current.children.has(seg)) {
        current.children.set(seg, createNode(seg, runningPath))
      }
      current = current.children.get(seg)
    }
    current.items.push(item)
  }

  function sortNode(node) {
    node.items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    const sortedChildren = Array.from(node.children.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )
    node.children = new Map(sortedChildren)

    for (const child of node.children.values()) {
      sortNode(child)
    }
  }
  sortNode(root)

  return root
}

function dirname(p) {
  const n = normalizePath(p)
  const idx = n.lastIndexOf('/')
  return idx > 0 ? n.slice(0, idx) : ''
}

function MediaList({ items, onEditMetadata, onRunAiAnalysis, onOpenRecommendations, onPlay, onDeleteMedia, }) {
  if (!items?.length) {
    return <p className="empty-state">No media imported yet.</p>
  }

  const root = buildFolderTree(items)
  const rootChildren = Array.from(root.children.values())
  const rootItems = root.items

  return (
    <section className="media-tree">
      {rootItems?.length > 0 && (
        <div className="tree-root-items">
          <div className="tree-root-label">Single Files</div>
          <FolderNode
            node={{
              name: 'Single Files',
              fullPath: 'Single Files',
              children: new Map(),
              items: rootItems,
            }}
            depth={0}
            onPlay={onPlay}
            onEditMetadata={onEditMetadata}
            onRunAiAnalysis={onRunAiAnalysis}
            onOpenRecommendations={onOpenRecommendations}
            onDeleteMedia={onDeleteMedia}
          />
        </div>
      )}

      {rootChildren.map((node) => (
        <FolderNode
          key={node.fullPath}
          node={node}
          depth={0}
          onPlay={onPlay}
          onEditMetadata={onEditMetadata}
          onRunAiAnalysis={onRunAiAnalysis}
          onOpenRecommendations={onOpenRecommendations}
          onDeleteMedia={onDeleteMedia}
        />
      ))}
    </section>
  )
}

export default MediaList
