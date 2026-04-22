from __future__ import annotations
from typing import Dict, Optional
from .base_ai import Analyzer, MediaType

class AnalyzerRegistry:
  def __init__(self) -> None:
    self._analyzers: Dict[str, Analyzer] = {}

  def register(self, analyzer: Analyzer) -> None:
    self._analyzers[analyzer.provider_name] = analyzer

  def get(self, provider_name: str) -> Analyzer:
    if provider_name not in self._analyzers:
      raise KeyError(f"Unknown analyzer provider: {provider_name}")
    return self._analyzers[provider_name]

  def pick(self, media_type: MediaType, preferred: Optional[str] = None) -> Analyzer:
    if preferred:
      a = self.get(preferred)
      if media_type in a.supported_types:
        return a
      raise KeyError(f"Provider {preferred} does not support {media_type}")

    for a in self._analyzers.values():
      if media_type in a.supported_types:
        return a

    raise KeyError(f"No analyzer registered for media_type={media_type}")
