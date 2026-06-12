import { apiClient } from "@/lib/api/client";
import type {
  AIEmployee,
  AIEmployeeDetail,
  AIEmployeeDocumentAssignment,
  AIEmployeeToolAssignment,
  ChatRequest,
  ChatResponse,
  CreateEmployeeInput,
  EmployeeConversation,
  ToolAssignmentInput,
  UpdateEmployeeInput,
  AIEmployeeStatus,
} from "@/lib/ai-employees/types";

const EMPLOYEES_BASE = "/api/v1/employees";

export function listEmployees(
  token: string,
  status?: AIEmployeeStatus,
): Promise<AIEmployee[]> {
  const query = status ? `?status=${status}` : "";
  return apiClient<AIEmployee[]>(`${EMPLOYEES_BASE}${query}`, {
    method: "GET",
    token,
  });
}

export function getEmployee(
  token: string,
  employeeId: string,
): Promise<AIEmployeeDetail> {
  return apiClient<AIEmployeeDetail>(`${EMPLOYEES_BASE}/${employeeId}`, {
    method: "GET",
    token,
  });
}

export function createEmployee(
  token: string,
  input: CreateEmployeeInput,
): Promise<AIEmployee> {
  return apiClient<AIEmployee>(EMPLOYEES_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateEmployee(
  token: string,
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<AIEmployee> {
  return apiClient<AIEmployee>(`${EMPLOYEES_BASE}/${employeeId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteEmployee(
  token: string,
  employeeId: string,
): Promise<void> {
  return apiClient<void>(`${EMPLOYEES_BASE}/${employeeId}`, {
    method: "DELETE",
    token,
  });
}

export function activateEmployee(
  token: string,
  employeeId: string,
): Promise<AIEmployee> {
  return apiClient<AIEmployee>(`${EMPLOYEES_BASE}/${employeeId}/activate`, {
    method: "POST",
    token,
  });
}

export function deactivateEmployee(
  token: string,
  employeeId: string,
): Promise<AIEmployee> {
  return apiClient<AIEmployee>(`${EMPLOYEES_BASE}/${employeeId}/deactivate`, {
    method: "POST",
    token,
  });
}

export function getEmployeeKnowledge(
  token: string,
  employeeId: string,
): Promise<AIEmployeeDocumentAssignment[]> {
  return apiClient<AIEmployeeDocumentAssignment[]>(
    `${EMPLOYEES_BASE}/${employeeId}/knowledge`,
    { method: "GET", token },
  );
}

export function replaceEmployeeKnowledge(
  token: string,
  employeeId: string,
  knowledgeDocumentIds: string[],
): Promise<AIEmployeeDocumentAssignment[]> {
  return apiClient<AIEmployeeDocumentAssignment[]>(
    `${EMPLOYEES_BASE}/${employeeId}/knowledge`,
    {
      method: "PUT",
      token,
      body: { knowledge_document_ids: knowledgeDocumentIds },
    },
  );
}

export function getEmployeeTools(
  token: string,
  employeeId: string,
): Promise<AIEmployeeToolAssignment[]> {
  return apiClient<AIEmployeeToolAssignment[]>(
    `${EMPLOYEES_BASE}/${employeeId}/tools`,
    { method: "GET", token },
  );
}

export function replaceEmployeeTools(
  token: string,
  employeeId: string,
  tools: ToolAssignmentInput[],
): Promise<AIEmployeeToolAssignment[]> {
  return apiClient<AIEmployeeToolAssignment[]>(
    `${EMPLOYEES_BASE}/${employeeId}/tools`,
    {
      method: "PUT",
      token,
      body: { tools },
    },
  );
}

export function chatWithEmployee(
  token: string,
  employeeId: string,
  payload: ChatRequest,
): Promise<ChatResponse> {
  return apiClient<ChatResponse>(`${EMPLOYEES_BASE}/${employeeId}/chat`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function listEmployeeConversations(
  token: string,
  employeeId: string,
): Promise<EmployeeConversation[]> {
  return apiClient<EmployeeConversation[]>(
    `${EMPLOYEES_BASE}/${employeeId}/conversations`,
    { method: "GET", token },
  );
}
