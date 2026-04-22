import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

function formatSize(bytes) {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

function MediaItemCard({
  item,
  onPlay,
  onEditMetadata,
  onRunAiAnalysis,
  onOpenRecommendations,
  onDeleteMedia,
}) {
  const tags = Array.isArray(item.tags) ? item.tags : []
  const isTagged = tags.length > 0
  const analysisFailed = item.analysisFailed === true

  return (
    <article className={`media-card media-card--${item.type}`}>
      <div className="media-card-header-row">
        <div className="media-card-header">
          <div className="media-card-badges">
            <span className="media-card-type">
              {item.type.toUpperCase()}
            </span>

            {isTagged && (
              <span className="media-card-tagged">tagged</span>
            )}
            {analysisFailed && (
              <span className="media-card-tagged media-card-tagged--failed">failed</span>
            )}
          </div>

          <span className="media-card-size">{formatSize(item.sizeBytes)}</span>
        </div>
      </div>

      <div className="media-card-body">
        <div className="media-card-main">
          <button
            className="media-card-play"
            onClick={() => onPlay?.(item)}
            aria-label={`Play ${item.name}`}
            title="Play"
          >
            ▶
          </button>

          <h3 className="media-card-name" title={item.name}>
            {item.name}
          </h3>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="media-card-menu-button" aria-label="Open menu">
                ⋮
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="DropdownMenuContent"
                sideOffset={6}
                align="end"
              >
                <DropdownMenu.Item
                  className="DropdownMenuItem"
                  onSelect={() => onEditMetadata?.(item)}
                >
                  Edit metadata
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  className="DropdownMenuItem"
                  onSelect={() => onRunAiAnalysis?.(item)}
                >
                  AI analysis
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  className="DropdownMenuItem"
                  onSelect={() => onOpenRecommendations?.(item)}
                >
                  Recommendation
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="DropdownMenuSeparator" />

                <DropdownMenu.Item
                  className="DropdownMenuItem DropdownMenuItem--danger"
                  onSelect={() => onDeleteMedia?.(item)}
                >
                  Delete from library
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        <div className="media-card-tags">
          {tags.length > 0 ? (
            tags.slice(0, 10).map((tag) => (
              <span key={tag} className="media-tag">
                {tag}
              </span>
            ))
          ) : (
            <span className="media-tag media-tag--empty">no tags</span>
          )}
        </div>
      </div>
    </article>
  )
}

export default MediaItemCard
