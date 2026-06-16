"""Tests for support AI recommendation scoring."""

from app.models.enums import SupportTicketStatus
from app.schemas.knowledge_query import (
    NO_RELEVANT_INFORMATION_MESSAGE,
    KnowledgeSourceCitation,
)
from app.services.support_ai_recommendation import (
    HIGH_CONFIDENCE_THRESHOLD,
    build_support_recommendation,
)


def test_recommendation_high_confidence_allows_auto_resolve() -> None:
    recommendation = build_support_recommendation(
        answer="Employees receive 20 PTO days per year.",
        sources=[
            KnowledgeSourceCitation(
                document_title="HR Policy",
                page_number=3,
                similarity_score=0.91,
            ),
            KnowledgeSourceCitation(
                document_title="HR Policy",
                page_number=4,
                similarity_score=0.84,
            ),
        ],
    )

    assert recommendation.confidence >= HIGH_CONFIDENCE_THRESHOLD
    assert recommendation.recommended_status == SupportTicketStatus.RESOLVED
    assert recommendation.can_auto_resolve is True


def test_recommendation_no_knowledge_escalates() -> None:
    recommendation = build_support_recommendation(
        answer=NO_RELEVANT_INFORMATION_MESSAGE,
        sources=[],
    )

    assert recommendation.confidence < 0.2
    assert recommendation.recommended_status == SupportTicketStatus.WAITING
    assert recommendation.can_auto_resolve is False
    assert "Escalate" in recommendation.reasoning


def test_recommendation_ungrounded_response_needs_review() -> None:
    recommendation = build_support_recommendation(
        answer="Please contact HR for more details.",
        sources=[],
    )

    assert recommendation.recommended_status == SupportTicketStatus.IN_PROGRESS
    assert recommendation.can_auto_resolve is False
