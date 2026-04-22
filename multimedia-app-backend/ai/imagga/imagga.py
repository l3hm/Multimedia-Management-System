from __future__ import annotations
import os
from typing import Set
import httpx

from fastapi import HTTPException
from ..base_ai import Analyzer, AnalysisResult, MediaType


class ImaggaImageAnalyzer(Analyzer):
  def __init__(self, api_key: str, api_secret: str, tags_url: str) -> None:
    self._api_key = api_key
    self._api_secret = api_secret
    self._tags_url = tags_url

  @property
  def provider_name(self) -> str:
    return 'imagga'

  @property
  def supported_types(self) -> Set[MediaType]:
    return {'image'}

  async def analyze_file(self, *, media_type: MediaType, file_path: str, mime_type: str, file_name: str, ) -> AnalysisResult:
    if media_type != 'image':
      raise HTTPException(status_code=400, detail='Imagga analyzer supports images only.')

    if not self._api_key or not self._api_secret:
      raise HTTPException(status_code=500, detail='Imagga API credentials not configured. Please set IMAGGA_API_KEY and IMAGGA_API_SECRET.', )

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail='File not found on disk')

    try:
      with open(file_path, 'rb') as f:
        file_bytes = f.read()
    except Exception as e:
      raise HTTPException(status_code=500, detail=f'Failed to read file: {e}')

    auth = (self._api_key, self._api_secret)
    files = {'image': (file_name, file_bytes, mime_type)}

    try:
      async with httpx.AsyncClient() as client:
        resp = await client.post(self._tags_url, auth=auth, files=files)
        resp.raise_for_status()
    except httpx.HTTPError as e:
      raise HTTPException(status_code=502, detail=f'Imagga request failed: {e}')

    data = resp.json()
    tags_raw = data.get('result', {}).get('tags', [])
    tags = []
    for entry in tags_raw[:8]:
      tag_obj = entry.get('tag', {})
      english = tag_obj.get('en')
      if english:
        tags.append(english)

    if not tags:
      tags = ['untagged']

    return AnalysisResult(tags=tags, provider=self.provider_name, model=None)
