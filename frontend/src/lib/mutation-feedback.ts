import { getApiErrorMessage } from "@/lib/api/errors";

export interface MutationFeedbackToast {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface RunMutationWithFeedbackOptions<T> {
  action: () => Promise<T>;
  toast: MutationFeedbackToast;
  successMessage: string | ((result: T) => string);
  errorFallback: string;
  /** Runs before the success toast so UI updates are not blocked by notification errors. */
  onSuccess?: (result: T) => void | Promise<void>;
}

export async function runMutationWithFeedback<T>({
  action,
  toast,
  successMessage,
  errorFallback,
  onSuccess,
}: RunMutationWithFeedbackOptions<T>): Promise<T | undefined> {
  try {
    const result = await action();
    if (onSuccess) {
      await onSuccess(result);
    }
    const message =
      typeof successMessage === "function"
        ? successMessage(result)
        : successMessage;
    toast.success(message);
    return result;
  } catch (error) {
    toast.error(getApiErrorMessage(error, errorFallback));
    return undefined;
  }
}
