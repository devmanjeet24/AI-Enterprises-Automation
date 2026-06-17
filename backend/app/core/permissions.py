"""Canonical permission catalog and organization bootstrap helpers."""

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission

# --- Permission slugs (resource:action) ---

ORGANIZATIONS_READ = "organizations:read"
ORGANIZATIONS_WRITE = "organizations:write"

DEPARTMENTS_READ = "departments:read"
DEPARTMENTS_WRITE = "departments:write"
DEPARTMENTS_DELETE = "departments:delete"

TEAMS_READ = "teams:read"
TEAMS_WRITE = "teams:write"
TEAMS_DELETE = "teams:delete"

PERMISSIONS_READ = "permissions:read"
PERMISSIONS_WRITE = "permissions:write"
PERMISSIONS_DELETE = "permissions:delete"
PERMISSIONS_ASSIGN = "permissions:assign"

USERS_READ = "users:read"
USERS_WRITE = "users:write"
USERS_ASSIGN_ROLE = "users:assign-role"

ROLES_READ = "roles:read"
ROLES_WRITE = "roles:write"
ROLES_DELETE = "roles:delete"

DOCUMENTS_READ = "documents:read"
DOCUMENTS_WRITE = "documents:write"
DOCUMENTS_DELETE = "documents:delete"

KNOWLEDGE_QUERY = "knowledge:query"

EMPLOYEES_READ = "employees:read"
EMPLOYEES_WRITE = "employees:write"
EMPLOYEES_DELETE = "employees:delete"
EMPLOYEES_CHAT = "employees:chat"

AGENT_TEAMS_READ = "agent_teams:read"
AGENT_TEAMS_WRITE = "agent_teams:write"
AGENT_TEAMS_DELETE = "agent_teams:delete"
AGENT_TEAMS_EXECUTE = "agent_teams:execute"

WORKFLOWS_READ = "workflows:read"
WORKFLOWS_WRITE = "workflows:write"
WORKFLOWS_DELETE = "workflows:delete"

RESEARCH_PROJECTS_READ = "research_projects:read"
RESEARCH_PROJECTS_WRITE = "research_projects:write"
RESEARCH_PROJECTS_DELETE = "research_projects:delete"
RESEARCH_PROJECTS_EXECUTE = "research_projects:execute"

BROWSER_PROFILES_READ = "browser_profiles:read"
BROWSER_PROFILES_WRITE = "browser_profiles:write"
BROWSER_PROFILES_DELETE = "browser_profiles:delete"

BROWSER_TASKS_READ = "browser_tasks:read"
BROWSER_TASKS_WRITE = "browser_tasks:write"
BROWSER_TASKS_DELETE = "browser_tasks:delete"
BROWSER_TASKS_EXECUTE = "browser_tasks:execute"

SUPPORT_CATEGORIES_READ = "support_categories:read"
SUPPORT_CATEGORIES_WRITE = "support_categories:write"
SUPPORT_CATEGORIES_DELETE = "support_categories:delete"

SUPPORT_TICKETS_READ = "support_tickets:read"
SUPPORT_TICKETS_WRITE = "support_tickets:write"
SUPPORT_TICKETS_DELETE = "support_tickets:delete"
SUPPORT_TICKETS_EXECUTE = "support_tickets:execute"

VOICE_AGENTS_READ = "voice_agents:read"
VOICE_AGENTS_WRITE = "voice_agents:write"
VOICE_AGENTS_DELETE = "voice_agents:delete"

VOICE_SESSIONS_READ = "voice_sessions:read"
VOICE_SESSIONS_WRITE = "voice_sessions:write"
VOICE_SESSIONS_DELETE = "voice_sessions:delete"
VOICE_SESSIONS_EXECUTE = "voice_sessions:execute"

OMNICHANNEL_CHANNELS_READ = "omnichannel_channels:read"
OMNICHANNEL_CHANNELS_WRITE = "omnichannel_channels:write"
OMNICHANNEL_CHANNELS_DELETE = "omnichannel_channels:delete"

OMNICHANNEL_CONVERSATIONS_READ = "omnichannel_conversations:read"
OMNICHANNEL_CONVERSATIONS_WRITE = "omnichannel_conversations:write"
OMNICHANNEL_CONVERSATIONS_DELETE = "omnichannel_conversations:delete"
OMNICHANNEL_CONVERSATIONS_EXECUTE = "omnichannel_conversations:execute"

# Built-in roles created for every organization; their slugs cannot be deleted.
SYSTEM_ROLE_SLUGS: frozenset[str] = frozenset({"admin", "manager", "member"})

ALL_PERMISSION_SLUGS: tuple[str, ...] = (
    ORGANIZATIONS_READ,
    ORGANIZATIONS_WRITE,
    DEPARTMENTS_READ,
    DEPARTMENTS_WRITE,
    DEPARTMENTS_DELETE,
    TEAMS_READ,
    TEAMS_WRITE,
    TEAMS_DELETE,
    PERMISSIONS_READ,
    PERMISSIONS_WRITE,
    PERMISSIONS_DELETE,
    PERMISSIONS_ASSIGN,
    USERS_READ,
    USERS_WRITE,
    USERS_ASSIGN_ROLE,
    ROLES_READ,
    ROLES_WRITE,
    ROLES_DELETE,
    DOCUMENTS_READ,
    DOCUMENTS_WRITE,
    DOCUMENTS_DELETE,
    KNOWLEDGE_QUERY,
    EMPLOYEES_READ,
    EMPLOYEES_WRITE,
    EMPLOYEES_DELETE,
    EMPLOYEES_CHAT,
    AGENT_TEAMS_READ,
    AGENT_TEAMS_WRITE,
    AGENT_TEAMS_DELETE,
    AGENT_TEAMS_EXECUTE,
    WORKFLOWS_READ,
    WORKFLOWS_WRITE,
    WORKFLOWS_DELETE,
    RESEARCH_PROJECTS_READ,
    RESEARCH_PROJECTS_WRITE,
    RESEARCH_PROJECTS_DELETE,
    RESEARCH_PROJECTS_EXECUTE,
    BROWSER_PROFILES_READ,
    BROWSER_PROFILES_WRITE,
    BROWSER_PROFILES_DELETE,
    BROWSER_TASKS_READ,
    BROWSER_TASKS_WRITE,
    BROWSER_TASKS_DELETE,
    BROWSER_TASKS_EXECUTE,
    SUPPORT_CATEGORIES_READ,
    SUPPORT_CATEGORIES_WRITE,
    SUPPORT_CATEGORIES_DELETE,
    SUPPORT_TICKETS_READ,
    SUPPORT_TICKETS_WRITE,
    SUPPORT_TICKETS_DELETE,
    SUPPORT_TICKETS_EXECUTE,
    VOICE_AGENTS_READ,
    VOICE_AGENTS_WRITE,
    VOICE_AGENTS_DELETE,
    VOICE_SESSIONS_READ,
    VOICE_SESSIONS_WRITE,
    VOICE_SESSIONS_DELETE,
    VOICE_SESSIONS_EXECUTE,
    OMNICHANNEL_CHANNELS_READ,
    OMNICHANNEL_CHANNELS_WRITE,
    OMNICHANNEL_CHANNELS_DELETE,
    OMNICHANNEL_CONVERSATIONS_READ,
    OMNICHANNEL_CONVERSATIONS_WRITE,
    OMNICHANNEL_CONVERSATIONS_DELETE,
    OMNICHANNEL_CONVERSATIONS_EXECUTE,
)


@dataclass(frozen=True)
class PermissionDefinition:
    name: str
    slug: str
    description: str


DEFAULT_PERMISSIONS: tuple[PermissionDefinition, ...] = (
    PermissionDefinition(
        "Read Organization",
        ORGANIZATIONS_READ,
        "View organization profile and dashboard overview",
    ),
    PermissionDefinition(
        "Write Organization",
        ORGANIZATIONS_WRITE,
        "Update organization profile and settings",
    ),
    PermissionDefinition("Read Departments", DEPARTMENTS_READ, "View department records"),
    PermissionDefinition("Write Departments", DEPARTMENTS_WRITE, "Create and update departments"),
    PermissionDefinition("Delete Departments", DEPARTMENTS_DELETE, "Delete departments"),
    PermissionDefinition("Read Teams", TEAMS_READ, "View team records"),
    PermissionDefinition("Write Teams", TEAMS_WRITE, "Create and update teams"),
    PermissionDefinition("Delete Teams", TEAMS_DELETE, "Delete teams"),
    PermissionDefinition("Read Permissions", PERMISSIONS_READ, "View permissions and role grants"),
    PermissionDefinition("Write Permissions", PERMISSIONS_WRITE, "Create and update permissions"),
    PermissionDefinition("Delete Permissions", PERMISSIONS_DELETE, "Delete permissions"),
    PermissionDefinition("Assign Permissions", PERMISSIONS_ASSIGN, "Grant or revoke permissions on roles"),
    PermissionDefinition("Read Users", USERS_READ, "View user accounts in the organization"),
    PermissionDefinition("Write Users", USERS_WRITE, "Update user profiles and deactivate accounts"),
    PermissionDefinition("Assign User Roles", USERS_ASSIGN_ROLE, "Grant or revoke roles on user accounts"),
    PermissionDefinition("Read Roles", ROLES_READ, "View roles in the organization"),
    PermissionDefinition("Write Roles", ROLES_WRITE, "Create and update roles"),
    PermissionDefinition("Delete Roles", ROLES_DELETE, "Delete custom roles"),
    PermissionDefinition("Read Documents", DOCUMENTS_READ, "View knowledge documents"),
    PermissionDefinition(
        "Write Documents",
        DOCUMENTS_WRITE,
        "Upload and update knowledge documents",
    ),
    PermissionDefinition("Delete Documents", DOCUMENTS_DELETE, "Delete knowledge documents"),
    PermissionDefinition(
        "Query Knowledge",
        KNOWLEDGE_QUERY,
        "Ask questions against the organization knowledge base",
    ),
    PermissionDefinition("Read Employees", EMPLOYEES_READ, "View AI employees in the organization"),
    PermissionDefinition(
        "Write Employees",
        EMPLOYEES_WRITE,
        "Create and configure AI employees",
    ),
    PermissionDefinition("Delete Employees", EMPLOYEES_DELETE, "Delete AI employees"),
    PermissionDefinition(
        "Chat with Employees",
        EMPLOYEES_CHAT,
        "Send messages to active AI employees",
    ),
    PermissionDefinition(
        "Read Agent Teams",
        AGENT_TEAMS_READ,
        "View multi-agent collaboration teams",
    ),
    PermissionDefinition(
        "Write Agent Teams",
        AGENT_TEAMS_WRITE,
        "Create and configure agent teams and memberships",
    ),
    PermissionDefinition(
        "Delete Agent Teams",
        AGENT_TEAMS_DELETE,
        "Delete agent teams",
    ),
    PermissionDefinition(
        "Execute Agent Teams",
        AGENT_TEAMS_EXECUTE,
        "Submit and run multi-agent collaboration tasks",
    ),
    PermissionDefinition("Read Workflows", WORKFLOWS_READ, "View workflow automation definitions"),
    PermissionDefinition(
        "Write Workflows",
        WORKFLOWS_WRITE,
        "Create and update workflow automation definitions",
    ),
    PermissionDefinition("Delete Workflows", WORKFLOWS_DELETE, "Delete workflow automation definitions"),
    PermissionDefinition(
        "Read Research Projects",
        RESEARCH_PROJECTS_READ,
        "View business research projects and reports",
    ),
    PermissionDefinition(
        "Write Research Projects",
        RESEARCH_PROJECTS_WRITE,
        "Create and update business research projects",
    ),
    PermissionDefinition(
        "Delete Research Projects",
        RESEARCH_PROJECTS_DELETE,
        "Delete business research projects",
    ),
    PermissionDefinition(
        "Execute Research Projects",
        RESEARCH_PROJECTS_EXECUTE,
        "Run research projects and generate reports",
    ),
    PermissionDefinition(
        "Read Browser Profiles",
        BROWSER_PROFILES_READ,
        "View browser automation profiles",
    ),
    PermissionDefinition(
        "Write Browser Profiles",
        BROWSER_PROFILES_WRITE,
        "Create and update browser automation profiles",
    ),
    PermissionDefinition(
        "Delete Browser Profiles",
        BROWSER_PROFILES_DELETE,
        "Delete browser automation profiles",
    ),
    PermissionDefinition(
        "Read Browser Tasks",
        BROWSER_TASKS_READ,
        "View browser automation task definitions",
    ),
    PermissionDefinition(
        "Write Browser Tasks",
        BROWSER_TASKS_WRITE,
        "Create and update browser automation task definitions",
    ),
    PermissionDefinition(
        "Delete Browser Tasks",
        BROWSER_TASKS_DELETE,
        "Delete browser automation task definitions",
    ),
    PermissionDefinition(
        "Execute Browser Tasks",
        BROWSER_TASKS_EXECUTE,
        "Run browser automation tasks",
    ),
    PermissionDefinition(
        "Read Support Categories",
        SUPPORT_CATEGORIES_READ,
        "View customer support ticket categories",
    ),
    PermissionDefinition(
        "Write Support Categories",
        SUPPORT_CATEGORIES_WRITE,
        "Create and update customer support ticket categories",
    ),
    PermissionDefinition(
        "Delete Support Categories",
        SUPPORT_CATEGORIES_DELETE,
        "Delete customer support ticket categories",
    ),
    PermissionDefinition(
        "Read Support Tickets",
        SUPPORT_TICKETS_READ,
        "View customer support tickets and conversation threads",
    ),
    PermissionDefinition(
        "Write Support Tickets",
        SUPPORT_TICKETS_WRITE,
        "Create and update customer support tickets",
    ),
    PermissionDefinition(
        "Delete Support Tickets",
        SUPPORT_TICKETS_DELETE,
        "Delete customer support tickets",
    ),
    PermissionDefinition(
        "Execute Support Tickets",
        SUPPORT_TICKETS_EXECUTE,
        "Respond to support tickets and manage ticket workflow actions",
    ),
    PermissionDefinition(
        "Read Voice Agents",
        VOICE_AGENTS_READ,
        "View voice AI agents and their configuration",
    ),
    PermissionDefinition(
        "Write Voice Agents",
        VOICE_AGENTS_WRITE,
        "Create and update voice AI agents",
    ),
    PermissionDefinition(
        "Delete Voice Agents",
        VOICE_AGENTS_DELETE,
        "Delete voice AI agents",
    ),
    PermissionDefinition(
        "Read Voice Sessions",
        VOICE_SESSIONS_READ,
        "View voice session history and transcripts",
    ),
    PermissionDefinition(
        "Write Voice Sessions",
        VOICE_SESSIONS_WRITE,
        "Create voice sessions",
    ),
    PermissionDefinition(
        "Delete Voice Sessions",
        VOICE_SESSIONS_DELETE,
        "Delete voice sessions",
    ),
    PermissionDefinition(
        "Execute Voice Sessions",
        VOICE_SESSIONS_EXECUTE,
        "Upload audio and run voice transcription with AI responses",
    ),
    PermissionDefinition(
        "Read Omnichannel Channels",
        OMNICHANNEL_CHANNELS_READ,
        "View omnichannel communication channels",
    ),
    PermissionDefinition(
        "Write Omnichannel Channels",
        OMNICHANNEL_CHANNELS_WRITE,
        "Create and update omnichannel communication channels",
    ),
    PermissionDefinition(
        "Delete Omnichannel Channels",
        OMNICHANNEL_CHANNELS_DELETE,
        "Delete omnichannel communication channels",
    ),
    PermissionDefinition(
        "Read Omnichannel Conversations",
        OMNICHANNEL_CONVERSATIONS_READ,
        "View unified inbox and conversation history",
    ),
    PermissionDefinition(
        "Write Omnichannel Conversations",
        OMNICHANNEL_CONVERSATIONS_WRITE,
        "Create and update omnichannel conversations",
    ),
    PermissionDefinition(
        "Delete Omnichannel Conversations",
        OMNICHANNEL_CONVERSATIONS_DELETE,
        "Delete omnichannel conversations",
    ),
    PermissionDefinition(
        "Execute Omnichannel Conversations",
        OMNICHANNEL_CONVERSATIONS_EXECUTE,
        "Send messages, request handoff, and use AI-assisted responses",
    ),
)

# Which permission slugs each default role receives on organization creation.
ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": ALL_PERMISSION_SLUGS,
    "manager": (
        ORGANIZATIONS_READ,
        DEPARTMENTS_READ,
        DEPARTMENTS_WRITE,
        DEPARTMENTS_DELETE,
        TEAMS_READ,
        TEAMS_WRITE,
        TEAMS_DELETE,
        PERMISSIONS_READ,
        USERS_READ,
        ROLES_READ,
        DOCUMENTS_READ,
        DOCUMENTS_WRITE,
        KNOWLEDGE_QUERY,
        EMPLOYEES_READ,
        EMPLOYEES_WRITE,
        EMPLOYEES_CHAT,
        AGENT_TEAMS_READ,
        AGENT_TEAMS_WRITE,
        AGENT_TEAMS_EXECUTE,
        WORKFLOWS_READ,
        WORKFLOWS_WRITE,
        RESEARCH_PROJECTS_READ,
        RESEARCH_PROJECTS_WRITE,
        RESEARCH_PROJECTS_EXECUTE,
        BROWSER_PROFILES_READ,
        BROWSER_PROFILES_WRITE,
        BROWSER_TASKS_READ,
        BROWSER_TASKS_WRITE,
        BROWSER_TASKS_EXECUTE,
        SUPPORT_CATEGORIES_READ,
        SUPPORT_CATEGORIES_WRITE,
        SUPPORT_TICKETS_READ,
        SUPPORT_TICKETS_WRITE,
        SUPPORT_TICKETS_EXECUTE,
        VOICE_AGENTS_READ,
        VOICE_AGENTS_WRITE,
        VOICE_SESSIONS_READ,
        VOICE_SESSIONS_WRITE,
        VOICE_SESSIONS_EXECUTE,
        OMNICHANNEL_CHANNELS_READ,
        OMNICHANNEL_CHANNELS_WRITE,
        OMNICHANNEL_CONVERSATIONS_READ,
        OMNICHANNEL_CONVERSATIONS_WRITE,
        OMNICHANNEL_CONVERSATIONS_EXECUTE,
    ),
    "member": (
        ORGANIZATIONS_READ,
        DEPARTMENTS_READ,
        TEAMS_READ,
        DOCUMENTS_READ,
        KNOWLEDGE_QUERY,
        EMPLOYEES_READ,
        EMPLOYEES_CHAT,
        AGENT_TEAMS_READ,
        AGENT_TEAMS_EXECUTE,
        WORKFLOWS_READ,
        RESEARCH_PROJECTS_READ,
        RESEARCH_PROJECTS_EXECUTE,
        BROWSER_PROFILES_READ,
        BROWSER_TASKS_READ,
        BROWSER_TASKS_EXECUTE,
        SUPPORT_CATEGORIES_READ,
        SUPPORT_TICKETS_READ,
        SUPPORT_TICKETS_EXECUTE,
        VOICE_AGENTS_READ,
        VOICE_SESSIONS_READ,
        VOICE_SESSIONS_EXECUTE,
        OMNICHANNEL_CHANNELS_READ,
        OMNICHANNEL_CONVERSATIONS_READ,
        OMNICHANNEL_CONVERSATIONS_EXECUTE,
    ),
}


def seed_organization_permissions(
    db: Session,
    organization_id: uuid.UUID,
    roles: dict[str, Role],
) -> dict[str, Permission]:
    """Create the default permission set and assign them to standard roles."""
    permissions_by_slug: dict[str, Permission] = {}

    for definition in DEFAULT_PERMISSIONS:
        permission = Permission(
            organization_id=organization_id,
            name=definition.name,
            slug=definition.slug,
            description=definition.description,
        )
        db.add(permission)
        permissions_by_slug[definition.slug] = permission

    db.flush()

    for role_slug, permission_slugs in ROLE_PERMISSION_SLUGS.items():
        role = roles[role_slug]
        for permission_slug in permission_slugs:
            db.add(
                RolePermission(
                    role_id=role.id,
                    permission_id=permissions_by_slug[permission_slug].id,
                )
            )

    db.flush()
    return permissions_by_slug
