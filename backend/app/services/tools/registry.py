"""Canonical tool catalog for AI Employee Studio."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ToolDefinition:
    slug: str
    name: str
    description: str


TOOL_DEFINITIONS: tuple[ToolDefinition, ...] = (
    ToolDefinition(
        slug="knowledge_search",
        name="Knowledge Search",
        description="Search assigned knowledge documents for relevant context",
    ),
    ToolDefinition(
        slug="calculator",
        name="Calculator",
        description="Perform basic arithmetic calculations",
    ),
)

_TOOLS_BY_SLUG: dict[str, ToolDefinition] = {
    definition.slug: definition for definition in TOOL_DEFINITIONS
}


def list_tool_definitions() -> list[ToolDefinition]:
    """Return all tools available for assignment to AI employees."""
    return list(TOOL_DEFINITIONS)


def get_tool_definition(tool_slug: str) -> ToolDefinition | None:
    """Look up one tool definition by slug."""
    return _TOOLS_BY_SLUG.get(tool_slug)


def is_known_tool_slug(tool_slug: str) -> bool:
    """Return whether a slug exists in the tool catalog."""
    return tool_slug in _TOOLS_BY_SLUG
