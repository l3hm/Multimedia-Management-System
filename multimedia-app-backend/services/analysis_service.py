from __future__ import annotations
import os
from fastapi import HTTPException
from typing import Optional, cast

from ai.base_ai import MediaType
from graph_storage import get_media_by_id, save_media_tags

ALLOWED_TYPES = {"image", "audio", "video"}

async def analyze_by_id(*, media_id: str, registry, provider: Optional[str] = None):
    item = get_media_by_id(media_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Media item with id {media_id} not found")

    raw_type = item.get("type")
    if raw_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"No analyzer for media type: {raw_type}")

    media_type = cast(MediaType, raw_type)

    path = item.get("absolutePath")
    mime_type = item.get("mimeType") or "application/octet-stream"
    name = item.get("name") or os.path.basename(path or "")

    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    try:
        analyzer = registry.pick(media_type, preferred=provider)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = await analyzer.analyze_file(media_type=media_type, file_path=path, mime_type=mime_type, file_name=name, )
    save_media_tags(media_id, result.tags)

    return {"id": media_id, "tags": result.tags, "provider": result.provider, "model": result.model}