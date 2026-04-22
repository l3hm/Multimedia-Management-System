from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Set, Literal
from schemas import AnalysisResult

MediaType = Literal["image", "audio", "video"]

class Analyzer(ABC):
  @property
  @abstractmethod
  def provider_name(self) -> str:
    ...
  
  @property
  @abstractmethod
  def supported_types(self) -> Set[MediaType]:
    ...
  
  @abstractmethod
  async def analyze_file(self, *, media_type: MediaType, file_path: str, mime_type: str, file_name: str, ) -> AnalysisResult:
    ... 