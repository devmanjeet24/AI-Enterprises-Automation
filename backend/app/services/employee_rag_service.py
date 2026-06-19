"""Employee-scoped retrieval-augmented generation."""

import uuid

from fastapi import HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage

from app.config import Settings
from app.schemas.knowledge_query import (
    NO_RELEVANT_INFORMATION_MESSAGE,
    KnowledgeSourceCitation,
    is_no_relevant_information_answer,
)
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.rag_service import RAGService, SupportsChatInvoke, build_citations, build_context
from app.services.retrieval_service import search_documents

EMPLOYEE_GROUNDING_SUFFIX = """

Answer ONLY using the provided context.
If the answer is not contained in the context, reply exactly with:
"I could not find relevant information in the knowledge base."
Be concise, factual, and use the same language as the question when possible."""


class EmployeeRAGService:
    """Generate grounded answers using an employee prompt and assigned documents."""

    def __init__(self, settings: Settings, llm: SupportsChatInvoke | None = None) -> None:
        self._settings = settings
        self._rag_service = RAGService(settings, llm=llm)

    def answer_for_employee(
        self,
        *,
        organization_id: uuid.UUID,
        system_prompt: str,
        question: str,
        document_ids: list[uuid.UUID],
        embedding_service: EmbeddingService,
        chroma_service: ChromaService,
        conversation_history: list[tuple[str, str]] | None = None,
    ) -> tuple[str, list[KnowledgeSourceCitation]]:
        """Retrieve from assigned documents and generate an employee-grounded answer."""
        search_response = search_documents(
            organization_id=organization_id,
            query=question,
            settings=self._settings,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            document_ids=document_ids,
        )

        if not search_response.results:
            return NO_RELEVANT_INFORMATION_MESSAGE, []

        relevant_results = [
            result
            for result in search_response.results
            if result.similarity_score >= self._settings.retrieval_min_similarity_score
        ]
        if not relevant_results:
            return NO_RELEVANT_INFORMATION_MESSAGE, []

        context = build_context(relevant_results)
        history_messages = _build_history_messages(conversation_history)
        answer = self._rag_service._generate_answer(
            question=question,
            context=context,
            system_prompt=f"{system_prompt.strip()}{EMPLOYEE_GROUNDING_SUFFIX}",
            history_messages=history_messages,
        )
        if is_no_relevant_information_answer(answer):
            return NO_RELEVANT_INFORMATION_MESSAGE, []
        return answer, build_citations(relevant_results)


def _build_history_messages(
    conversation_history: list[tuple[str, str]] | None,
) -> list[HumanMessage | AIMessage]:
    if not conversation_history:
        return []

    messages: list[HumanMessage | AIMessage] = []
    for role, content in conversation_history:
        if role == "user":
            messages.append(HumanMessage(content=content))
        else:
            messages.append(AIMessage(content=content))
    return messages


def citations_to_json(
    sources: list[KnowledgeSourceCitation],
) -> list[dict[str, object]]:
    """Serialize citations for persistence on assistant messages."""
    return [source.model_dump() for source in sources]
