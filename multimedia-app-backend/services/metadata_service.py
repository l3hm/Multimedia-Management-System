import os, json, subprocess
from fastapi import HTTPException
from graph_storage import get_media_by_id

def _run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise HTTPException(status_code=502, detail=p.stderr[:1200] or "Metadata tool failed")
    return p.stdout

def read_metadata_by_id(media_id: str):
    item = get_media_by_id(media_id)
    if not item:
        raise HTTPException(404, "Media not found")
    path = item.get("absolutePath")
    if not path or not os.path.exists(path):
        raise HTTPException(404, "File not found on disk")

    out = _run(["exiftool", "-j", path])
    data = json.loads(out)[0] if out else {}
    return {"id": media_id, "metadata": data}

def _is_mp3(item: dict, path: str) -> bool:
    mime_type = (item or {}).get("mimeType") or ""
    if mime_type.lower() in {"audio/mpeg", "audio/mp3", "audio/mpeg3"}:
        return True
    return os.path.splitext(path)[1].lower() == ".mp3"

def _write_mp3_metadata(path: str, patch: dict) -> None:
    from mutagen.easyid3 import EasyID3
    from mutagen.id3 import ID3NoHeaderError

    try:
        audio = EasyID3(path)
    except ID3NoHeaderError:
        audio = EasyID3()
        audio.save(path)
        audio = EasyID3(path)

    tag_map = {
        "Title": "title",
        "Artist": "artist",
        "Album": "album",
        "AlbumArtist": "albumartist",
        "Track": "tracknumber",
        "TrackNumber": "tracknumber",
        "Disc": "discnumber",
        "DiscNumber": "discnumber",
        "Year": "date",
        "Date": "date",
        "Genre": "genre",
        "Comment": "comment",
        "Composer": "composer",
        "Copyright": "copyright",
        "EncodedBy": "encodedby",
    }

    for raw_key, value in patch.items():
        if value is None:
            continue
        key = tag_map.get(raw_key)
        if not key and isinstance(raw_key, str):
            normalized = raw_key.strip()
            key = tag_map.get(normalized)
            if not key:
                key = tag_map.get(normalized.lower(), normalized.lower())
        if not key:
            continue
        try:
            if isinstance(value, (list, tuple)):
                audio[key] = [str(v) for v in value if v is not None]
            else:
                audio[key] = [str(value)]
        except KeyError:
            continue

    audio.save(path)

def write_metadata_by_id(media_id: str, patch: dict):
    item = get_media_by_id(media_id)
    if not item:
        raise HTTPException(404, "Media not found")
    path = item.get("absolutePath")
    if not path or not os.path.exists(path):
        raise HTTPException(404, "File not found on disk")

    if _is_mp3(item, path):
        _write_mp3_metadata(path, patch)
        return read_metadata_by_id(media_id)

    args = ["exiftool", "-overwrite_original"]
    for k, v in patch.items():
        if v is None:
            continue
        args.append(f"-{k}={v}")
    args.append(path)

    _run(args)

    return read_metadata_by_id(media_id)
