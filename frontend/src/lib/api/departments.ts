import { apiClient } from "@/lib/api/client";
import type {
  CreateDepartmentInput,
  Department,
  UpdateDepartmentInput,
} from "@/lib/departments/types";

const DEPARTMENTS_BASE = "/api/v1/departments";

export function listDepartments(token: string): Promise<Department[]> {
  return apiClient<Department[]>(DEPARTMENTS_BASE, { method: "GET", token });
}

export function getDepartment(token: string, departmentId: string): Promise<Department> {
  return apiClient<Department>(`${DEPARTMENTS_BASE}/${departmentId}`, {
    method: "GET",
    token,
  });
}

export function createDepartment(
  token: string,
  input: CreateDepartmentInput,
): Promise<Department> {
  return apiClient<Department>(DEPARTMENTS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateDepartment(
  token: string,
  departmentId: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  return apiClient<Department>(`${DEPARTMENTS_BASE}/${departmentId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteDepartment(token: string, departmentId: string): Promise<void> {
  return apiClient<void>(`${DEPARTMENTS_BASE}/${departmentId}`, {
    method: "DELETE",
    token,
  });
}
