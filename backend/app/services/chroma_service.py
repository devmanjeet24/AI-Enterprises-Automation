"""Persist and query chunk embeddings in ChromaDB."""

import uuid
from dataclasses import dataclass

import chromadb

from app.models.document_chunk import DocumentChunk
from app.models.knowledge_document import KnowledgeDocument


@dataclass(frozen=True)
class ChromaSearchHit:
    """One semantic search match returned from ChromaDB."""

    chunk_id: str
    document_id: str
    document_title: str
    chunk_index: int
    page_number: int | None
    content: str
    similarity_score: float


class ChromaService:
    """Organization-scoped ChromaDB collections for multi-tenant vector search."""

    def __init__(self, persist_dir: str) -> None:
        self._client = chromadb.PersistentClient(path=persist_dir)

    @staticmethod
    def collection_name(organization_id: uuid.UUID) -> str:
        """Build a stable collection name for one organization."""
        return f"org_{organization_id.hex}"

    def _get_collection(self, organization_id: uuid.UUID):
        return self._client.get_or_create_collection(
            name=self.collection_name(organization_id),
            metadata={"hnsw:space": "cosine"},
        )

    def delete_vectors_for_document(
        self,
        organization_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> None:
        """Remove all vectors belonging to one document."""
        collection = self._get_collection(organization_id)
        collection.delete(where={"document_id": str(document_id)})

    def upsert_document_chunks(
        self,
        *,
        organization_id: uuid.UUID,
        document: KnowledgeDocument,
        chunks: list[DocumentChunk],
        embeddings: list[list[float]],
    ) -> None:
        """Store chunk embeddings for one document."""
        if len(chunks) != len(embeddings):
            raise ValueError("Chunk and embedding counts must match")

        collection = self._get_collection(organization_id)
        ids = [str(chunk.id) for chunk in chunks]
        documents = [chunk.content for chunk in chunks]
        metadatas = [
            {
                "organization_id": str(organization_id),
                "document_id": str(document.id),
                "chunk_id": str(chunk.id),
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number or 0,
                "document_title": document.title,
            }
            for chunk in chunks
        ]

        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

    def search(
        self,
        *,
        organization_id: uuid.UUID,
        query_embedding: list[float],
        top_k: int,
    ) -> list[ChromaSearchHit]:
        """Return the most similar chunks for one organization."""
        collection = self._get_collection(organization_id)
        if collection.count() == 0:
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"organization_id": str(organization_id)},
            include=["documents", "metadatas", "distances"],
        )

        hits: list[ChromaSearchHit] = []
        ids = results.get("ids", [[]])[0]
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for chunk_id, content, metadata, distance in zip(ids, documents, metadatas, distances, strict=True):
            page_number_raw = int(metadata.get("page_number", 0))
            hits.append(
                ChromaSearchHit(
                    chunk_id=chunk_id,
                    document_id=metadata["document_id"],
                    document_title=metadata["document_title"],
                    chunk_index=int(metadata["chunk_index"]),
                    page_number=page_number_raw if page_number_raw > 0 else None,
                    content=content,
                    similarity_score=_distance_to_similarity(float(distance)),
                )
            )

        return hits


def _distance_to_similarity(distance: float) -> float:
    """Convert Chroma cosine distance into a 0-1 similarity score."""
    return max(0.0, min(1.0, 1.0 - distance))
