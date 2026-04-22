from graph_storage import get_driver, NEO4J_DB
from typing import List, Dict

def recommend_by_tags(media_id: str, limit: int = 5) -> List[Dict]:
    driver = get_driver()

    cypher = """
    MATCH (m:Media {id: $id})-[:HAS_TAG]->(t:Tag)<-[:HAS_TAG]-(other:Media)
    WHERE m <> other
    RETURN
      other {
        .id, .name, .type, .mimeType, .sizeBytes, .absolutePath
      } AS media,
      collect(t.name) AS sharedTags,
      count(t) AS score
    ORDER BY score DESC
    LIMIT $limit
    """

    db = NEO4J_DB or None
    with driver.session(database=db) as session:
        result = session.run(cypher, id=media_id, limit=limit)
        return [
            {
                **dict(r["media"]),
                "sharedTags": r["sharedTags"],
                "score": r["score"],
            }
            for r in result
        ]
