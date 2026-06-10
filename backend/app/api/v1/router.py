from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    departments,
    documents,
    health,
    permissions,
    roles,
    teams,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(departments.router)
api_router.include_router(teams.router)
api_router.include_router(permissions.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
