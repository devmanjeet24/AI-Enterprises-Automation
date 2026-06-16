"""Generate grounded answers using retrieved knowledge chunks and Groq."""

import uuid
from typing import Protocol

from fastapi import HTTPException, status
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.config import Settings
from app.schemas.knowledge_query import (
    NO_RELEVANT_INFORMATION_MESSAGE,
    KnowledgeQueryResponse,
    KnowledgeSourceCitation,
    is_no_relevant_information_answer,
)
from app.schemas.knowledge_search import DocumentSearchResult
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import search_documents

SYSTEM_PROMPT = """You are a helpful assistant for company knowledge documents.
Answer ONLY using the provided context.
If the answer is not contained in the context, reply exactly with:
"I could not find relevant information in the knowledge base."
Be concise, factual, and use the same language as the question when possible."""


class SupportsChatInvoke(Protocol):
    def invoke(self, messages: list) -> object: ...


class RAGService:
    """Retrieve relevant chunks and generate a grounded answer with citations."""

    def __init__(self, settings: Settings, llm: SupportsChatInvoke | None = None) -> None:
        self._settings = settings
        self._llm = llm or self._build_llm(settings)

    def answer_question(
        self,
        *,
        organization_id: uuid.UUID,
        question: str,
        embedding_service: EmbeddingService,
        chroma_service: ChromaService,
    ) -> KnowledgeQueryResponse:
        """Run retrieval-augmented generation for one organization-scoped question."""
        search_response = search_documents(
            organization_id=organization_id,
            query=question,
            settings=self._settings,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
        )

        if not search_response.results:
            return KnowledgeQueryResponse(
                answer=NO_RELEVANT_INFORMATION_MESSAGE,
                sources=[],
            )

        relevant_results = [
            result
            for result in search_response.results
            if result.similarity_score >= self._settings.retrieval_min_similarity_score
        ]
        if not relevant_results:
            return KnowledgeQueryResponse(
                answer=NO_RELEVANT_INFORMATION_MESSAGE,
                sources=[],
            )

        context = build_context(relevant_results)
        answer = self._generate_answer(
            question=question,
            context=context,
            system_prompt=SYSTEM_PROMPT,
        )
        if is_no_relevant_information_answer(answer):
            return KnowledgeQueryResponse(
                answer=NO_RELEVANT_INFORMATION_MESSAGE,
                sources=[],
            )
        sources = build_citations(relevant_results)
        return KnowledgeQueryResponse(answer=answer, sources=sources)

    def _generate_answer(
        self,
        *,
        question: str,
        context: str,
        system_prompt: str = SYSTEM_PROMPT,
        history_messages: list | None = None,
    ) -> str:
        messages = [SystemMessage(content=system_prompt)]
        if history_messages:
            messages.extend(history_messages)
        messages.append(
            HumanMessage(
                content=(
                    f"Context:\n{context}\n\n"
                    f"Question: {question}\n\n"
                    "Answer:"
                )
            )
        )

        try:
            response = self._llm.invoke(messages)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to generate answer from language model",
            ) from exc

        content = getattr(response, "content", None)
        if not isinstance(content, str) or not content.strip():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Language model returned an empty answer",
            )
        return content.strip()

    @staticmethod
    def _build_llm(settings: Settings) -> BaseChatModel:
        return ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model_name,
            temperature=settings.groq_temperature,
            max_tokens=settings.groq_max_tokens,
        )


def build_context(results: list[DocumentSearchResult]) -> str:
    """Format retrieved chunks into labeled context blocks for the LLM."""
    blocks: list[str] = []
    for result in results:
        page_label = f", Page {result.page_number}" if result.page_number else ""
        blocks.append(f"[Source: {result.document_title}{page_label}]\n{result.content}")
    return "\n\n".join(blocks)


def build_citations(results: list[DocumentSearchResult]) -> list[KnowledgeSourceCitation]:
    """Deduplicate citations by document title and page, keeping the strongest match."""
    best_matches: dict[tuple[str, int | None], KnowledgeSourceCitation] = {}

    for result in results:
        key = (result.document_title, result.page_number)
        citation = KnowledgeSourceCitation(
            document_title=result.document_title,
            page_number=result.page_number,
            similarity_score=result.similarity_score,
        )
        existing = best_matches.get(key)
        if existing is None or citation.similarity_score > existing.similarity_score:
            best_matches[key] = citation

    return sorted(
        best_matches.values(),
        key=lambda citation: citation.similarity_score,
        reverse=True,
    )
