import { ApiError } from "@/lib/api/client";

type ValidationDetail = {
  msg: string;
};

type ApiErrorBody = {
  detail?: string | ValidationDetail[];
};

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) {
    const body = error.body as ApiErrorBody | undefined;

    if (typeof body?.detail === "string") {
      return body.detail;
    }

    if (Array.isArray(body?.detail) && body.detail.length > 0) {
      return body.detail.map((item) => item.msg).join(". ");
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
