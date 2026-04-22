import os
import mimetypes
from typing import List, Dict, Optional

from schemas import MediaItemInput, ImportResponse
from graph_storage import (list_media, import_media_items, clear_media_graph, )

def build_media_item(path: str) -> Optional[Dict]:
  if not os.path.isfile(path):
    return None

  stat = os.stat(path)
  size_bytes = stat.st_size
  last_modified = int(stat.st_mtime * 1000)

  mime_type, _ = mimetypes.guess_type(path)
  mime_type = mime_type or "application/octet-stream"

  if mime_type.startswith("image/"):
    media_type = "image"
  elif mime_type.startswith("video/"):
    media_type = "video"
  elif mime_type.startswith("audio/"):
    media_type = "audio"
  else:
    media_type = "other"

  name = os.path.basename(path)
  item_id = f"{path}-{last_modified}-{size_bytes}"

  return {
    "id": item_id,
    "name": name,
    "type": media_type,
    "mimeType": mime_type,
    "sizeBytes": size_bytes,
    "lastModified": last_modified,
    "absolutePath": path,
  }

def get_library_items() -> List[Dict]:
    return list_media()

def clear_library_all() -> None:
    clear_media_graph()

def import_from_paths_service(paths: List[str]) -> ImportResponse:
  new_items: List[Dict] = []

  for root_path in paths:
    if not os.path.exists(root_path):
      continue

    if os.path.isdir(root_path):
      for root, _, files in os.walk(root_path):
        for file_name in files:
          file_path = os.path.join(root, file_name)
          item = build_media_item(file_path)
          if item:
            item["importRoot"] = root_path
            new_items.append(item)
    else:
      item = build_media_item(root_path)
      if item:
        item["importRoot"] = os.path.dirname(root_path)
        new_items.append(item)

  added, duplicates = import_media_items(new_items)

  return ImportResponse(
    added=[MediaItemInput(**i) for i in added],
    duplicates=[MediaItemInput(**i) for i in duplicates],
  )