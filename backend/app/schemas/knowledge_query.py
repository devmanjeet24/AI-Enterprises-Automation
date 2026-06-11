"""Pydantic schemas for RAG knowledge question answering."""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.validators import StrippedKnowledgeQuestion

NO_RELEVANT_INFORMATION_MESSAGE = (
    "I could not find relevant information in the knowledge base."
)


class KnowledgeQueryRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"question": "How many annual leaves are allowed?"},
                {"question": "What is the reimbursement policy for travel expenses?"},
            ]
        }
    )

    question: StrippedKnowledgeQuestion


class KnowledgeSourceCitation(BaseModel):
    document_title: str
    page_number: int | None = Field(default=None, ge=1)
    similarity_score: float = Field(ge=0.0, le=1.0)


class KnowledgeQueryResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "answer": "Employees are entitled to 20 annual leave days per year.",
                    "sources": [
                        {
                            "document_title": "Employee Handbook",
                            "page_number": 4,
                            "similarity_score": 0.91,
                        }
                    ],
                }
            ]
        }
    )

    answer: str
    sources: list[KnowledgeSourceCitation]
