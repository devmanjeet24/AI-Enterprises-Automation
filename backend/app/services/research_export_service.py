"""Export research reports to Markdown and PDF."""

import textwrap
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.research_project import ResearchProject
from app.models.research_report import ResearchReport
from app.services.research_project_service import get_research_project_or_404
from app.services.research_runner_service import get_research_report_or_404
from app.services.research_templates import get_template


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_markdown_export(
    *,
    project: ResearchProject,
    report: ResearchReport,
) -> str:
    """Render a research report as Markdown."""
    template = get_template(project.template_type)
    lines = [
        f"# {project.name}",
        "",
        f"**Template:** {template.name}",
        f"**Version:** {report.version_number}",
        f"**Status:** {report.status.value}",
        f"**Generated:** {report.completed_at or report.created_at}",
        "",
        "## Research Brief",
        "",
        project.research_brief or "_No brief provided._",
        "",
        "## Final Report",
        "",
        report.final_output or "_No final output available._",
    ]

    if report.intermediate_outputs:
        lines.extend(["", "## Intermediate Steps", ""])
        for step in report.intermediate_outputs:
            order = step.get("sequence_order", "?")
            step_status = step.get("status", "unknown")
            output = step.get("output") or "_No output._"
            lines.extend(
                [
                    f"### Step {order} ({step_status})",
                    "",
                    str(output),
                    "",
                ]
            )

    if report.error_message:
        lines.extend(["", "## Error", "", report.error_message])

    return "\n".join(lines)


def build_pdf_bytes(
    *,
    project: ResearchProject,
    report: ResearchReport,
) -> bytes:
    """Generate a minimal valid PDF document (foundation for full PDF rendering)."""
    markdown = build_markdown_export(project=project, report=report)
    plain_lines = [
        line.lstrip("#").strip() if line.startswith("#") else line
        for line in markdown.splitlines()
    ]
    content_lines = plain_lines[:60] or ["Research report export"]
    y_position = 750
    text_commands = ["BT", "/F1 11 Tf", "14 TL"]
    for line in content_lines:
        if not line.strip():
            y_position -= 14
            continue
        wrapped = textwrap.wrap(line, width=90) or [""]
        for wrapped_line in wrapped:
            text_commands.append(f"50 {y_position} Td")
            text_commands.append(f"({_escape_pdf_text(wrapped_line)}) Tj")
            text_commands.append("T*")
            y_position -= 14
            if y_position < 50:
                break
        if y_position < 50:
            break
    text_commands.append("ET")
    stream_content = "\n".join(text_commands)
    stream_bytes = stream_content.encode("latin-1", errors="replace")

    objects: list[bytes] = []
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    objects.append(
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
    )
    objects.append(
        f"4 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode()
        + stream_bytes
        + b"\nendstream\nendobj\n"
    )
    objects.append(
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    )

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(obj)

    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode()
    )
    return bytes(pdf)


def export_research_report_markdown(
    db: Session,
    *,
    organization_id: uuid.UUID,
    project_id: uuid.UUID,
    report_id: uuid.UUID,
) -> tuple[str, str]:
    """Return filename and markdown body for a report export."""
    project = get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=organization_id,
    )
    report = get_research_report_or_404(
        db,
        report_id=report_id,
        organization_id=organization_id,
    )
    if report.research_project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research report not found",
        )
    if report.status.value != "completed" or not report.final_output:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed reports with output can be exported",
        )

    filename = f"{project.slug}-v{report.version_number}.md"
    return filename, build_markdown_export(project=project, report=report)


def export_research_report_pdf(
    db: Session,
    *,
    organization_id: uuid.UUID,
    project_id: uuid.UUID,
    report_id: uuid.UUID,
) -> tuple[str, bytes]:
    """Return filename and PDF bytes for a report export."""
    project = get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=organization_id,
    )
    report = get_research_report_or_404(
        db,
        report_id=report_id,
        organization_id=organization_id,
    )
    if report.research_project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research report not found",
        )
    if report.status.value != "completed" or not report.final_output:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed reports with output can be exported",
        )

    filename = f"{project.slug}-v{report.version_number}.pdf"
    return filename, build_pdf_bytes(project=project, report=report)
