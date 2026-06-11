"""Lightweight tool helpers for AI employee step execution."""

import ast
import operator
from typing import Any

from app.models.ai_employee_tool import AIEmployeeTool
from app.services.tools.registry import get_tool_definition


def build_tool_prompt_suffix(enabled_tools: list[AIEmployeeTool]) -> str:
    """Append enabled tool capabilities to the employee system prompt."""
    if not enabled_tools:
        return ""

    lines = ["\n\nYou have access to the following tools:"]
    for assignment in enabled_tools:
        if not assignment.is_enabled:
            continue
        definition = get_tool_definition(assignment.tool_slug)
        if definition is None:
            continue
        lines.append(f"- {definition.name}: {definition.description}")
    return "\n".join(lines)


def try_calculator(expression: str) -> str | None:
    """Evaluate a simple arithmetic expression when the calculator tool is enabled."""
    cleaned = expression.strip()
    if not cleaned:
        return None

    try:
        result = _safe_eval_arithmetic(cleaned)
    except (ValueError, SyntaxError, TypeError, ZeroDivisionError):
        return None
    return str(result)


def _safe_eval_arithmetic(expression: str) -> float | int:
    node = ast.parse(expression, mode="eval")

    def _eval(item: ast.AST) -> Any:
        if isinstance(item, ast.Expression):
            return _eval(item.body)
        if isinstance(item, ast.Constant) and isinstance(item.value, (int, float)):
            return item.value
        if isinstance(item, ast.UnaryOp) and isinstance(item.op, (ast.UAdd, ast.USub)):
            value = _eval(item.operand)
            if not isinstance(value, (int, float)):
                raise ValueError("Unsupported operand")
            return +value if isinstance(item.op, ast.UAdd) else -value
        if isinstance(item, ast.BinOp):
            left = _eval(item.left)
            right = _eval(item.right)
            if not isinstance(left, (int, float)) or not isinstance(right, (int, float)):
                raise ValueError("Unsupported operand")
            operator_map = {
                ast.Add: operator.add,
                ast.Sub: operator.sub,
                ast.Mult: operator.mul,
                ast.Div: operator.truediv,
            }
            op_type = type(item.op)
            if op_type not in operator_map:
                raise ValueError("Unsupported operator")
            return operator_map[op_type](left, right)
        raise ValueError("Unsupported expression")

    value = _eval(node)
    if not isinstance(value, (int, float)):
        raise ValueError("Unsupported expression")
    return value
