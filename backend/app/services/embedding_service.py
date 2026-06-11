"""Generate dense vector embeddings for chunks and search queries."""

from langchain_community.embeddings import HuggingFaceEmbeddings

BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


class EmbeddingService:
    """Wrap LangChain HuggingFace embeddings for document and query vectors."""

    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self._embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple document chunks."""
        if not texts:
            return []
        return self._embeddings.embed_documents(texts)

    def embed_query(self, query: str) -> list[float]:
        """Embed a user search query."""
        prepared_query = query
        if "bge" in self.model_name.lower():
            prepared_query = f"{BGE_QUERY_PREFIX}{query}"
        return self._embeddings.embed_query(prepared_query)
