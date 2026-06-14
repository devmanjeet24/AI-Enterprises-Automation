import { ApiError } from "@/lib/api/client";

export function isAnalyticsAccessDeniedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
