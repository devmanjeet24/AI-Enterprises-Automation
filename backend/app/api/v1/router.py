from fastapi import APIRouter

from app.api.v1.endpoints import (
    agent_tasks,
    agent_teams,
    auth,
    browser_profiles,
    browser_tasks,
    conversations,
    dashboard,
    departments,
    documents,
    employees,
    health,
    knowledge,
    organizations,
    permissions,
    research_projects,
    roles,
    teams,
    users,
    workflows,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(organizations.router)
api_router.include_router(dashboard.router)
api_router.include_router(documents.router)
api_router.include_router(knowledge.router)
api_router.include_router(employees.router)
api_router.include_router(agent_teams.router)
api_router.include_router(agent_tasks.router)
api_router.include_router(workflows.router)
api_router.include_router(research_projects.router)
api_router.include_router(browser_profiles.router)
api_router.include_router(browser_tasks.router)
api_router.include_router(conversations.router)
api_router.include_router(departments.router)
api_router.include_router(teams.router)
api_router.include_router(permissions.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
