"""Dashboard overview endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard_service import get_dashboard_overview

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def read_dashboard_overview(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> DashboardOverviewResponse:
    """Return organization-wide resource counts for the home dashboard."""
    return get_dashboard_overview(db, organization_id=current_user.organization_id)
