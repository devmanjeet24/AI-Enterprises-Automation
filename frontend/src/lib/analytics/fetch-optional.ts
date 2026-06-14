import { isAnalyticsAccessDeniedError } from "./access";

export async function fetchOptional<T>(
  fetcher: () => Promise<T>,
): Promise<{ data?: T; accessDenied: boolean; error?: unknown }> {
  try {
    return { data: await fetcher(), accessDenied: false };
  } catch (error) {
    if (isAnalyticsAccessDeniedError(error)) {
      return { accessDenied: true };
    }
    throw error;
  }
}
