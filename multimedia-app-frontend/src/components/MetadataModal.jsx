import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { METADATA_FIELDS } from '../config/metadataFields'

export default function MetadataModal({ open, item, onOpenChange, apiBase, onSaved }) {
  const fields = useMemo(() => {
    if (!item?.type) return []
    return METADATA_FIELDS[item.type] || []
  }, [item?.type])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState({})
  const [draft, setDraft] = useState({})

  useEffect(() => {
    if (!open || !item?.id) return

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${apiBase}/metadata/${encodeURIComponent(item.id)}`)
        const payload = await res.json().catch(() => null)
        if (!res.ok) throw new Error(payload?.detail || `Failed (${res.status})`)

        setMeta(payload?.metadata || {})
        setDraft(payload?.metadata || {})
      } catch (e) {
        setError(e?.message || 'Failed to load metadata')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, item?.id, apiBase])

  const onChangeField = (key, value) => {
    setDraft((p) => ({ ...p, [key]: value }))
  }

  const onSave = async () => {
    if (!item?.id) return
    setSaving(true)
    setError('')
    try {
      const patch = {}
      for (const f of fields) {
        if (!f.editable) continue
        patch[f.key] = draft[f.key] ?? ''
      }

      const res = await fetch(`${apiBase}/metadata/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: patch }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.detail || `Save failed (${res.status})`)

      onOpenChange(false)
      onSaved?.()
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ModalOverlay" />
        <Dialog.Content className="ModalContent">
          <Dialog.Title className="ModalTitle">Edit metadata</Dialog.Title>
          <Dialog.Description className="ModalDescription">
            {item ? item.name : ''}
          </Dialog.Description>

          {loading ? (
            <div className="ModalBody">Loading…</div>
          ) : (
            <div className="ModalBody">
              {error ? <div className="ModalError">{error}</div> : null}

              {fields.map((f) => {
                const value = draft[f.key] ?? ''

                const readOnly = !f.editable
                const commonProps = {
                  value: String(value),
                  disabled: readOnly || saving,
                  onChange: (e) => onChangeField(f.key, e.target.value),
                }

                return (
                  <div key={f.key} className="ModalRow">
                    <label className="ModalLabel">{f.label}</label>

                    {f.type === 'textarea' ? (
                      <textarea className="ModalTextarea" {...commonProps} />
                    ) : (
                      <input className="ModalInput" {...commonProps} />
                    )}

                    {readOnly ? <div className="ModalHint">read-only</div> : null}
                  </div>
                )
              })}
            </div>
          )}

          <div className="ModalFooter">
            <button className="ModalBtn" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </button>
            <button className="ModalBtn ModalBtn--primary" onClick={onSave} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}