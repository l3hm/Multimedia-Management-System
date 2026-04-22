from __future__ import annotations
import os
import asyncio
from typing import Set, List, Optional
import httpx
from fastapi import HTTPException

from ..base_ai import Analyzer, AnalysisResult, MediaType
from ai.cyanite.cyanite_queries import FILE_UPLOAD_REQUEST, CREATE_LIBRARY_TRACK, FETCH_LIBRARY_TRACK

def _as_str_list(values):
    out = []
    for v in values or []:
        if v is None:
            continue
        if isinstance(v, str):
            out.append(v)
        elif isinstance(v, dict):
            if "name" in v and isinstance(v["name"], str):
                out.append(v["name"])
            elif "tag" in v and isinstance(v["tag"], str):
                out.append(v["tag"])
            elif "label" in v and isinstance(v["label"], str):
                out.append(v["label"])
            else:
                out.append(str(v))
        else:
            out.append(str(v))
    return out


class CyaniteAudioAnalyzer(Analyzer):
    def __init__(self, *, api_url: str, access_token: str) -> None:
        self._api_url = api_url
        self._token = access_token

    @property
    def provider_name(self) -> str:
        return "cyanite"

    @property
    def supported_types(self) -> Set[MediaType]:
        return {"audio"}

    async def _gql(
        self,
        client: httpx.AsyncClient,
        query: str,
        variables: Optional[dict] = None,
    ) -> dict:
        headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }

        r = await client.post(
            self._api_url,
            json={"query": query, "variables": variables or {}},
            headers=headers,
        )

        if r.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"Cyanite HTTP {r.status_code}: {r.text}",
            )

        data = r.json()
        if data.get("errors"):
            raise HTTPException(
                status_code=502,
                detail=f"Cyanite GraphQL error: {data['errors']}",
            )

        return data["data"]

    async def analyze_file(self, *, media_type: MediaType, file_path: str, mime_type: str, file_name: str, ) -> AnalysisResult:
        if media_type != "audio":
            raise HTTPException(400, "Cyanite supports audio only")
        if not self._token:
            raise HTTPException(500, "CYANITE_ACCESS_TOKEN not configured")

        async with httpx.AsyncClient(timeout=120) as client:
            d1 = await self._gql(client, FILE_UPLOAD_REQUEST)
            upload = d1["fileUploadRequest"]

            upload_id = upload["id"]
            upload_url = upload["uploadUrl"]

            with open(file_path, "rb") as f:
                content = f.read()

            put = await client.put(
                upload_url,
                content=content,
                headers={"Content-Type": mime_type or "audio/mpeg"},
            )

            if put.status_code not in (200, 201, 204):
                raise HTTPException(502, "Cyanite upload failed")

            d2 = await self._gql(
                client,
                CREATE_LIBRARY_TRACK,
                variables={
                    "input": {
                        "uploadId": upload_id,
                        "title": os.path.splitext(file_name)[0],
                    }
                },
            )

            res = d2["libraryTrackCreate"]
            if res["__typename"] != "LibraryTrackCreateSuccess":
                raise HTTPException(
                    502,
                    f"Cyanite create failed: {res.get('message')}",
                )

            track_id = res["createdLibraryTrack"]["id"]

            for _ in range(60):
                d3 = await self._gql(client, FETCH_LIBRARY_TRACK, variables={"id": track_id})
                node = d3.get("libraryTrack")
                if not node:
                    raise HTTPException(status_code=502, detail="Cyanite libraryTrack fetch failed")

                if node.get("__typename") == "LibraryTrackNotFoundError":
                    raise HTTPException(status_code=404, detail=node.get("message") or "Cyanite: track not found")

                if node.get("__typename") != "LibraryTrack":
                    raise HTTPException(status_code=502, detail=f"Unexpected Cyanite type: {node.get('__typename')}")

                aa = node.get("audioAnalysisV7") or node.get("audioAnalysisV6")
                if not aa:
                    await asyncio.sleep(2)
                    continue

                aa_type = aa.get("__typename")

                if aa_type.endswith("Finished"):
                    result = aa.get("result") or {}

                    tags = []
                    tags += _as_str_list(result.get("genreTags"))
                    tags += _as_str_list(result.get("subgenreTags"))
                    tags += _as_str_list(result.get("moodTags"))
                    tags += _as_str_list(result.get("instrumentTags"))

                    free = result.get("freeGenreTags")
                    if isinstance(free, str) and free.strip():
                        tags.append(free.strip())

                    tags = list(dict.fromkeys([t for t in tags if t]))[:12] or ["untagged"]

                    return AnalysisResult(
                        tags=tags,
                        provider="cyanite",
                        model="audioAnalysisV7" if "V7" in aa_type else "audioAnalysisV6",
                    )

                if aa_type.endswith("Failed") or aa_type.endswith("NotAuthorized"):
                    raise HTTPException(status_code=502, detail=f"Cyanite analysis state: {aa_type}")

                await asyncio.sleep(2)

            raise HTTPException(status_code=504, detail="Cyanite analysis timeout (still processing)")