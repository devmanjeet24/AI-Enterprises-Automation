"""Pydantic schemas for dashboard overview responses."""

from pydantic import BaseModel, Field


class DashboardOverviewResponse(BaseModel):
    total_users: int = Field(ge=0)
    total_departments: int = Field(ge=0)
    total_teams: int = Field(ge=0)
    total_documents: int = Field(ge=0)
    total_ai_employees: int = Field(ge=0)
    total_agent_tasks: int = Field(ge=0)
    total_workflows: int = Field(ge=0)
    total_research_projects: int = Field(ge=0)
    total_browser_tasks: int = Field(ge=0)
    total_support_tickets: int = Field(ge=0)
    total_voice_sessions: int = Field(ge=0)
    total_omnichannel_conversations: int = Field(ge=0)
