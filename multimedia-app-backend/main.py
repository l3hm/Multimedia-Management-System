from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from schemas import (MediaItemInput, ImportResponse, ImportFromPathsRequest, AnalyzeByIdRequest, MetadataResponse, MetadataPatchRequest)
import os
from urllib.parse import unquote
import shutil

from services.analysis_service import analyze_by_id
from ai.registry import AnalyzerRegistry
from ai.imagga.imagga import ImaggaImageAnalyzer
from ai.imagga.imagga_config import IMAGGA_API_KEY, IMAGGA_API_SECRET, IMAGGA_TAGS_URL

from ai.cyanite.cyanite_config import CYANITE_ACCESS_TOKEN, CYANITE_API_URL
from ai.cyanite.cyanite import CyaniteAudioAnalyzer

from graph_storage import init_constraints, get_media_by_id, delete_media_by_id
from services.media_service import (get_library_items, clear_library_all, import_from_paths_service, )
from services.metadata_service import (read_metadata_by_id, write_metadata_by_id)
from services.recommendation_service import recommend_by_tags

app = FastAPI(title="Media Backend")

#def check_exiftool():
#    if not shutil.which("exiftool"):
#        raise RuntimeError(
#            "ExifTool is not installed or not in PATH. "
#            "Please install ExifTool: https://exiftool.org/"
#        )

#check_exiftool()


origins = [ "http://localhost:5173", "http://127.0.0.1:5173", ]
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

init_constraints()

registry = AnalyzerRegistry()
registry.register(ImaggaImageAnalyzer(IMAGGA_API_KEY, IMAGGA_API_SECRET, IMAGGA_TAGS_URL))
registry.register(CyaniteAudioAnalyzer(api_url=CYANITE_API_URL, access_token=CYANITE_ACCESS_TOKEN))

@app.get("/library", response_model = List[MediaItemInput])
def get_library():
  return get_library_items()

@app.post("/library/import-from-paths", response_model = ImportResponse)
def import_from_paths(req: ImportFromPathsRequest):
  return import_from_paths_service(req.paths)

@app.post("/library/clear")
def clear_library():
  clear_library_all()
  return { "status": "cleared" }

@app.post("/analyze/by-id")
async def analyze(req: AnalyzeByIdRequest, provider: str | None = None):
    return await analyze_by_id(media_id=req.id, registry=registry, provider=provider)

@app.get("/media/{media_id}")
def get_media(media_id: str):
    item = get_media_by_id(media_id)
    if not item:
        raise HTTPException(status_code=404, detail="Media not found")

    path = item.get("absolutePath")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path,
        media_type=item.get("mimeType") or "application/octet-stream",
        filename=item.get("name"),
    )

@app.delete("/library")
def delete_media(media_id: str):
    ok = delete_media_by_id(media_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"status": "deleted", "id": media_id}

@app.get("/metadata/{media_id}", response_model=MetadataResponse)
def get_metadata(media_id: str):
    media_id = unquote(media_id)
    return read_metadata_by_id(media_id)

@app.patch("/metadata/{media_id}", response_model=MetadataResponse)
def patch_metadata(media_id: str, req: MetadataPatchRequest):
    media_id = unquote(media_id)
    return write_metadata_by_id(media_id, req.metadata)

@app.get("/recommendations/{media_id}")
def get_recommendations(media_id: str, limit: int = 5):
    media_id = unquote(media_id)
    return recommend_by_tags(media_id, limit)