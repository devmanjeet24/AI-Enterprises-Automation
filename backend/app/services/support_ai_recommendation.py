"""Derive support ticket resolution recommendations from RAG output."""

from dataclasses import dataclass

from app.models.enums import SupportTicketStatus
from app.schemas.knowledge_query import (
    NO_RELEVANT_INFORMATION_MESSAGE,
    KnowledgeSourceCitation,
    is_no_relevant_information_answer,
)

HIGH_CONFIDENCE_THRESHOLD = 0.75
MEDIUM_CONFIDENCE_THRESHOLD = 0.55


@dataclass(frozen=True)
class SupportAiRecommendation:
    confidence: float
    recommended_status: SupportTicketStatus
    reasoning: str
    can_auto_resolve: bool


def build_support_recommendation(
    *,
    answer: str,
    sources: list[KnowledgeSourceCitation],
) -> SupportAiRecommendation:
    """Score a grounded answer and recommend the next ticket status."""
    confidence = _compute_confidence(answer=answer, sources=sources)

    if is_no_relevant_information_answer(answer) or answer == NO_RELEVANT_INFORMATION_MESSAGE:
        return SupportAiRecommendation(
            confidence=confidence,
            recommended_status=SupportTicketStatus.WAITING,
            reasoning=(
                "No relevant knowledge base content was found for this question. "
                "Escalate to a human agent."
            ),
            can_auto_resolve=False,
        )

    if not sources:
        return SupportAiRecommendation(
            confidence=confidence,
            recommended_status=SupportTicketStatus.IN_PROGRESS,
            reasoning=(
                "The AI employee generated a response without knowledge base grounding. "
                "Manual verification is required before resolving."
            ),
            can_auto_resolve=False,
        )

    if confidence >= HIGH_CONFIDENCE_THRESHOLD:
        return SupportAiRecommendation(
            confidence=confidence,
            recommended_status=SupportTicketStatus.RESOLVED,
            reasoning=(
                "Assigned knowledge documents strongly match the customer's question. "
                "The response is fully grounded and ready to send."
            ),
            can_auto_resolve=True,
        )

    if confidence >= MEDIUM_CONFIDENCE_THRESHOLD:
        return SupportAiRecommendation(
            confidence=confidence,
            recommended_status=SupportTicketStatus.IN_PROGRESS,
            reasoning=(
                "Relevant policy excerpts were retrieved with moderate confidence. "
                "Review the draft before sending or resolving."
            ),
            can_auto_resolve=False,
        )

    return SupportAiRecommendation(
        confidence=confidence,
        recommended_status=SupportTicketStatus.WAITING,
        reasoning=(
            "Retrieval confidence is low for the assigned knowledge base. "
            "Escalate or gather more context before replying."
        ),
        can_auto_resolve=False,
    )


def _compute_confidence(
    *,
    answer: str,
    sources: list[KnowledgeSourceCitation],
) -> float:
    if is_no_relevant_information_answer(answer) or answer == NO_RELEVANT_INFORMATION_MESSAGE:
        return 0.12

    if not sources:
        return 0.35

    scores = [source.similarity_score for source in sources]
    top_score = max(scores)
    average_score = sum(scores) / len(scores)
    blended = (0.6 * top_score) + (0.4 * average_score)
    return round(min(1.0, max(0.0, blended)), 3)
