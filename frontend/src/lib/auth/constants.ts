export const AUTH_TOKEN_KEY = "lumen_access_token";
export const AUTH_COOKIE_NAME = "lumen_access_token";
export const TOKEN_MAX_AGE_SECONDS = 60 * 60;

export const DEFAULT_POST_LOGIN_PATH = "/overview";

export const PROTECTED_PATHS = [
  "/overview",
  "/knowledge-base",
  "/ai-employees",
  "/agent-teams",
  "/workflows",
  "/research-hub",
  "/browser-automation",
  "/customer-support",
  "/voice-ai",
  "/omnichannel",
  "/analytics",
  "/settings",
] as const;
