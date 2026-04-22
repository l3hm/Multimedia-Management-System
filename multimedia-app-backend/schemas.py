from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

class MediaItemInput(BaseModel):
  id: str
  name: str
  type: str
  mimeType: str | None = None
  sizeBytes: int | None = None
  lastModified: int | None = None
  absolutePath: str | None = None
  importRoot: str | None = None
  tags: list[str] | None = None

class ImportResponse(BaseModel):
  added: List[MediaItemInput]
  duplicates: List[MediaItemInput]

class ImportFromPathsRequest(BaseModel):
  paths: List[str]

class AnalyzeByIdRequest(BaseModel):
  id: str

@dataclass(frozen=True)
class AnalysisResult:
    tags: List[str]
    provider: str
    model: Optional[str] = None

class MetadataResponse(BaseModel):
    id: str
    metadata: Dict[str, Any]

class MetadataPatchRequest(BaseModel):
    metadata: Dict[str, Any]