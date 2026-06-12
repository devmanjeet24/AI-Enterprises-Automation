import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_KEY,
  TOKEN_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
