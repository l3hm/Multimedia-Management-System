import * as Dialog from '@radix-ui/react-dialog'

export default function RecommendationModal({
  open,
  onOpenChange,
  baseItem,
  items,
  onPlay,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ModalOverlay" />
        <Dialog.Content className="ModalContent">
          <Dialog.Title className="ModalTitle">
            Recommendations
          </Dialog.Title>

          <Dialog.Description className="ModalDescription">
            Based on tags from: <strong>{baseItem?.name}</strong>
          </Dialog.Description>

          <div className="ModalBody">
            {items.length === 0 ? (
              <div>No recommendations found.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="recommend-item">
                  <button
                    className="media-card-play"
                    onClick={() => onPlay(item)}
                  >
                    ▶
                  </button>

                  <div className="recommend-meta">
                    <div className="recommend-name">{item.name}</div>
                    <div className="recommend-tags">
                      Shared tags: {item.sharedTags.join(', ')}
                    </div>
                  </div>

                  <div className="recommend-score">
                    {item.score}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="ModalFooter">
            <button
              type="button"
              className="ModalBtn"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
