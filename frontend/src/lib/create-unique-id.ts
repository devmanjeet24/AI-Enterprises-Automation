let counter = 0;

/**
 * Generates a unique ID that works in HTTP, HTTPS, localhost, and VPS environments.
 * `crypto.randomUUID` is only available in secure contexts; this falls back safely.
 */
export function createUniqueId(prefix = "id"): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // Non-secure contexts (e.g. HTTP on a VPS IP) may expose crypto without randomUUID.
    }
  }

  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}
