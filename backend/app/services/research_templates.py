"""Predefined research methodology templates for agent team execution."""

from dataclasses import dataclass

from app.models.enums import ResearchTemplateType


@dataclass(frozen=True)
class ResearchTemplateStep:
    sequence_order: int
    name: str
    description: str
    prompt_template: str


@dataclass(frozen=True)
class ResearchTemplateDefinition:
    template_type: ResearchTemplateType
    name: str
    description: str
    steps: tuple[ResearchTemplateStep, ...]


_REVIEW_PROMPT = (
    "Review and refine the research findings produced so far. "
    "Ensure accuracy, completeness, and alignment with the research brief."
)


TEMPLATES: dict[ResearchTemplateType, ResearchTemplateDefinition] = {
    ResearchTemplateType.MARKET_RESEARCH: ResearchTemplateDefinition(
        template_type=ResearchTemplateType.MARKET_RESEARCH,
        name="Market Research",
        description="Analyze market size, demand trends, customer segments, and growth opportunities.",
        steps=(
            ResearchTemplateStep(
                1,
                "Market Discovery",
                "Gather market size, segments, and demand signals.",
                "Conduct market discovery for the research brief. Identify target segments, "
                "market size indicators, demand drivers, and geographic scope.",
            ),
            ResearchTemplateStep(
                2,
                "Customer Insights",
                "Analyze customer needs, pain points, and buying behavior.",
                "Analyze customer needs, pain points, buying behavior, and willingness to pay "
                "based on prior findings and the research brief.",
            ),
            ResearchTemplateStep(
                3,
                "Opportunity Synthesis",
                "Synthesize findings into actionable market opportunities.",
                "Synthesize prior findings into key market opportunities, risks, and strategic "
                "recommendations aligned with the research brief.",
            ),
            ResearchTemplateStep(
                4,
                "Market Research Report",
                "Produce a structured final market research report.",
                "Write a structured market research report with executive summary, methodology, "
                "findings, opportunities, risks, and recommendations.",
            ),
        ),
    ),
    ResearchTemplateType.COMPETITOR_ANALYSIS: ResearchTemplateDefinition(
        template_type=ResearchTemplateType.COMPETITOR_ANALYSIS,
        name="Competitor Analysis",
        description="Evaluate competitor positioning, offerings, strengths, and strategic gaps.",
        steps=(
            ResearchTemplateStep(
                1,
                "Competitor Identification",
                "Identify direct and indirect competitors.",
                "Identify direct and indirect competitors relevant to the research brief. "
                "List their core offerings and market positioning.",
            ),
            ResearchTemplateStep(
                2,
                "Competitive Benchmarking",
                "Compare features, pricing, and go-to-market strategies.",
                "Benchmark competitors on features, pricing, distribution, and go-to-market "
                "strategy using prior findings.",
            ),
            ResearchTemplateStep(
                3,
                "Gap Analysis",
                "Highlight competitive advantages and whitespace.",
                "Analyze competitive gaps, differentiation opportunities, and threats based on "
                "benchmarking results.",
            ),
            ResearchTemplateStep(
                4,
                "Competitor Analysis Report",
                "Produce a structured competitor analysis report.",
                "Write a structured competitor analysis report with competitor profiles, "
                "comparison matrix, strategic gaps, and recommendations.",
            ),
        ),
    ),
    ResearchTemplateType.INDUSTRY_ANALYSIS: ResearchTemplateDefinition(
        template_type=ResearchTemplateType.INDUSTRY_ANALYSIS,
        name="Industry Analysis",
        description="Assess industry structure, trends, regulation, and macro forces.",
        steps=(
            ResearchTemplateStep(
                1,
                "Industry Landscape",
                "Map industry structure and key players.",
                "Map the industry landscape for the research brief including value chain, "
                "key players, and market structure.",
            ),
            ResearchTemplateStep(
                2,
                "Trend Analysis",
                "Identify technological, economic, and regulatory trends.",
                "Analyze technological, economic, and regulatory trends shaping the industry.",
            ),
            ResearchTemplateStep(
                3,
                "Force Assessment",
                "Evaluate macro forces and industry dynamics.",
                "Assess macro forces (growth, consolidation, disruption) and their impact on "
                "the industry using prior findings.",
            ),
            ResearchTemplateStep(
                4,
                "Industry Analysis Report",
                "Produce a structured industry analysis report.",
                "Write a structured industry analysis report covering landscape, trends, "
                "forces, outlook, and strategic implications.",
            ),
        ),
    ),
    ResearchTemplateType.SWOT_ANALYSIS: ResearchTemplateDefinition(
        template_type=ResearchTemplateType.SWOT_ANALYSIS,
        name="SWOT Analysis",
        description="Evaluate strengths, weaknesses, opportunities, and threats.",
        steps=(
            ResearchTemplateStep(
                1,
                "Strengths & Weaknesses",
                "Assess internal capabilities and limitations.",
                "Identify internal strengths and weaknesses relevant to the research brief.",
            ),
            ResearchTemplateStep(
                2,
                "Opportunities & Threats",
                "Assess external opportunities and threats.",
                "Identify external opportunities and threats based on the research brief "
                "and prior internal assessment.",
            ),
            ResearchTemplateStep(
                3,
                "Strategic Implications",
                "Derive strategic actions from SWOT findings.",
                "Derive strategic implications and prioritized actions from the SWOT findings.",
            ),
            ResearchTemplateStep(
                4,
                "SWOT Report",
                "Produce a structured SWOT analysis report.",
                "Write a structured SWOT report with a 2x2 matrix, narrative analysis, "
                "and prioritized strategic recommendations.",
            ),
        ),
    ),
}


def get_template(template_type: ResearchTemplateType) -> ResearchTemplateDefinition:
    return TEMPLATES[template_type]


def list_templates() -> list[ResearchTemplateDefinition]:
    return list(TEMPLATES.values())


def build_step_prompts(
    *,
    template_type: ResearchTemplateType,
    research_brief: str,
    member_sequence_orders: list[int],
) -> dict[int, str]:
    """Map template step prompts onto agent team members by sequence order."""
    template = get_template(template_type)
    ordered_steps = sorted(template.steps, key=lambda step: step.sequence_order)
    prompts: dict[int, str] = {}

    for index, sequence_order in enumerate(sorted(member_sequence_orders)):
        if index < len(ordered_steps):
            step = ordered_steps[index]
            prompt = (
                f"{step.prompt_template}\n\n"
                f"Research brief:\n{research_brief.strip()}"
            )
        else:
            prompt = (
                f"{_REVIEW_PROMPT}\n\n"
                f"Research brief:\n{research_brief.strip()}"
            )
        prompts[sequence_order] = prompt

    return prompts
