import { useMemo, useState } from 'react'
import MediaItemCard from './MediaItemCard'
import { FaFolderOpen } from "react-icons/fa6";

function countItemsRecursive(node) {
  let total = node.items.length
  for (const child of node.children.values()) {
    total += countItemsRecursive(child)
  }
  return total
}

function countTypesRecursive(node) {
  let images = 0
  let videos = 0
  let audios = 0

  const bump = (t) => {
    if (t === 'image') images++
    else if (t === 'video') videos++
    else if (t === 'audio') audios++
  }

  for (const item of node.items) bump(item.type)

  for (const child of node.children.values()) {
    const sub = countTypesRecursive(child)
    images += sub.images
    videos += sub.videos
    audios += sub.audios
  }

  return { images, videos, audios }
}

function FolderNode({node, depth, onEditMetadata, onRunAiAnalysis, onOpenRecommendations, forceExpanded = false, onPlay, onDeleteMedia, }) {
  const [collapsed, setCollapsed] = useState(!forceExpanded)

  const hasChildren = node.children.size > 0
  const hasItems = node.items.length > 0

  const totalCount = useMemo(() => countItemsRecursive(node), [node])
  const typeCounts = useMemo(() => countTypesRecursive(node), [node])

  const indentStyle = { paddingLeft: `${depth * 16}px` }

  return (
    <div className="tree-node" style={indentStyle}>
      <div className="tree-folder-row">
        <button
          className="tree-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand folder' : 'Collapse folder'}
          title={collapsed ? 'Expand' : 'Collapse'}
          disabled={!hasChildren && !hasItems}
        >
          {collapsed ? '▸' : '▾'}
        </button>

        <span className="tree-folder-icon" aria-hidden="true">
          <FaFolderOpen />
        </span>

        <span className="tree-folder-name" title={node.fullPath}>
          {node.name}
        </span>

        <span className="tree-folder-meta">
          {totalCount} · {typeCounts.images} img · {typeCounts.videos} vid ·{' '}
          {typeCounts.audios} aud
        </span>
      </div>

      {!collapsed && (
        <div className="tree-children">
          {Array.from(node.children.values()).map((child) => (
            <FolderNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              onEditMetadata={onEditMetadata}
              onRunAiAnalysis={onRunAiAnalysis}
              onOpenRecommendations={onOpenRecommendations}
              onPlay={onPlay}
              onDeleteMedia={onDeleteMedia}
            />
          ))}
            {hasItems && (
              <div className="tree-items" style={{ paddingLeft: '16px' }}>
                {node.items.map((item) => (
                  <MediaItemCard
                    key={item.id}
                    item={item}
                    onEditMetadata={onEditMetadata}
                    onRunAiAnalysis={onRunAiAnalysis}
                    onOpenRecommendations={onOpenRecommendations}
                    onPlay={onPlay}
                    onDeleteMedia={onDeleteMedia}
                  />
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  )
}

export default FolderNode
