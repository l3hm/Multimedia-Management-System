import os
from typing import List, Dict
from dotenv import load_dotenv
from neo4j import GraphDatabase, Driver

load_dotenv()

#http://localhost:7474/browser für browser ansicht

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_DB = os.getenv("NEO4J_DB")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

_driver: Driver | None = None

def get_driver() -> Driver:
  global _driver
  if _driver is None:
    _driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
  return _driver

def close_driver() -> None:
  global _driver
  if _driver is not None:
    _driver.close()
    _driver = None

def init_constraints() -> None:
  driver = get_driver()
  statements = [
    "CREATE CONSTRAINT IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE",
  ]
  with driver.session(database=NEO4J_DB) as session:
    for statement in statements:
      session.run(statement)

def save_media(media: Dict) -> None:
  driver = get_driver()
  with driver.session(database=NEO4J_DB) as session:
    session.run(
      """
      MERGE (m:Media {id: $id})
      SET m.name = $name,
          m.type = $type,
          m.mimeType = $mimeType,
          m.sizeBytes = $sizeBytes,
          m.lastModified = $lastModified,
          m.absolutePath = $absolutePath,
          m.importRoot = $importRoot
      """,
      id=media.get("id"),
      name=media.get("name"),
      type=media.get("type"),
      mimeType=media.get("mimeType"),
      sizeBytes=media.get("sizeBytes"),
      lastModified=media.get("lastModified"),
      absolutePath=media.get("absolutePath"),
      importRoot=media.get("importRoot"),
    )

def save_media_tags(media_id: str, tags: List[str]) -> None:
  if not tags:
    return

  driver = get_driver()
  with driver.session(database=NEO4J_DB) as session:
    session.run(
      """
      MATCH (m:Media {id: $media_id})
      WITH m
      UNWIND $tags AS tagName
      MERGE (t:Tag {name: tagName})
      MERGE (m)-[:HAS_TAG]->(t)
      """,
      media_id=media_id,
      tags=tags,
    )

def clear_media_graph() -> None:
  driver = get_driver()
  with driver.session(database=NEO4J_DB) as session:
    session.run("""MATCH (n) WHERE n:Media OR n:Tag DETACH DELETE n""")

def list_media() -> List[Dict]:
    driver = get_driver()
    cypher = """
    MATCH (m:Media)
    OPTIONAL MATCH (m)-[:HAS_TAG]->(t:Tag)
    WITH m, collect(t.name) AS tags
    RETURN m {
        .id, .name, .type, .mimeType, .sizeBytes,
        .lastModified, .absolutePath, .importRoot
    } AS media, tags
    ORDER BY toLower(media.name)
    """
    with driver.session(database=NEO4J_DB) as session:
        result = session.run(cypher)
        items = []
        for r in result:
            item = dict(r["media"])
            item["tags"] = r["tags"] or []
            items.append(item)
        return items
    
def get_media_by_id(media_id: str) -> Dict | None:
    driver = get_driver()
    cypher = """
    MATCH (m:Media {id: $id})
    OPTIONAL MATCH (m)-[:HAS_TAG]->(t:Tag)
    RETURN m {
        .id, .name, .type, .mimeType, .sizeBytes,
        .lastModified, .absolutePath, .importRoot
    } AS media, collect(t.name) AS tags
    """
    with driver.session(database=NEO4J_DB) as session:
        r = session.run(cypher, id=media_id).single()
        if not r:
            return None
        item = dict(r["media"])
        item["tags"] = r["tags"] or []
        return item
    
def import_media_items(items: List[Dict]):
    """
    Returns (added, duplicates) using Neo4j uniqueness
    """
    if not items:
        return [], []

    driver = get_driver()
    ids = [i["id"] for i in items]

    with driver.session(database=NEO4J_DB) as session:
        existing = {
            r["id"]
            for r in session.run(
                "MATCH (m:Media) WHERE m.id IN $ids RETURN m.id AS id",
                ids=ids,
            )
        }

    added = [i for i in items if i["id"] not in existing]
    duplicates = [i for i in items if i["id"] in existing]

    for item in added:
        save_media(item)

    return added, duplicates

def delete_media_by_id(media_id: str) -> bool:
    driver = get_driver()
    cypher = """
    MATCH (m:Media {id: $id})
    OPTIONAL MATCH (m)-[r:HAS_TAG]->(t:Tag)
    WITH m, collect(DISTINCT t) AS tags, collect(r) AS rels
    FOREACH (x IN rels | DELETE x)
    DELETE m
    WITH tags
    UNWIND tags AS tag
    WITH tag
    WHERE tag IS NOT NULL AND NOT ( ()-[:HAS_TAG]->(tag) )
    DELETE tag
    RETURN count(*) AS deletedTags
    """
    with driver.session(database=NEO4J_DB) as session:
        r = session.run(cypher, id=media_id).single()
        return r is not None