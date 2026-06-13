import { ApiError } from "@/lib/api/client";

export function isAccessDeniedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
