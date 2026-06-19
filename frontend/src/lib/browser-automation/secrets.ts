import type { BrowserTaskStep } from "./steps";
import { buildConfigWithSteps } from "./steps";

export type BrowserTaskSecrets = Record<string, string>;

const STANDARD_SECRET_KEYS = ["username", "email", "password"] as const;

export function getSecretsFromConfig(
  config: Record<string, unknown> | null | undefined,
): BrowserTaskSecrets {
  const secrets = config?.secrets;
  if (!secrets || typeof secrets !== "object") return {};
  const result: BrowserTaskSecrets = {};
  for (const [key, value] of Object.entries(secrets)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

export function getStandardSecrets(secrets: BrowserTaskSecrets) {
  return {
    username: secrets.username ?? "",
    email: secrets.email ?? "",
    password: secrets.password ?? "",
  };
}

export function getCustomSecrets(secrets: BrowserTaskSecrets): BrowserTaskSecrets {
  return Object.fromEntries(
    Object.entries(secrets).filter(([key]) => !STANDARD_SECRET_KEYS.includes(key as typeof STANDARD_SECRET_KEYS[number])),
  );
}

export function buildTaskConfig(
  config: Record<string, unknown> | null | undefined,
  steps: BrowserTaskStep[],
  secrets: BrowserTaskSecrets,
): Record<string, unknown> {
  const nextConfig = buildConfigWithSteps(config, steps);
  const filteredSecrets = Object.fromEntries(
    Object.entries(secrets).filter(([, value]) => value.trim().length > 0),
  );
  if (Object.keys(filteredSecrets).length > 0) {
    nextConfig.secrets = filteredSecrets;
  } else {
    delete nextConfig.secrets;
  }
  return nextConfig;
}

export function mergeSecrets(
  standard: { username: string; email: string; password: string },
  custom: BrowserTaskSecrets,
): BrowserTaskSecrets {
  const merged: BrowserTaskSecrets = { ...custom };
  if (standard.username.trim()) merged.username = standard.username.trim();
  if (standard.email.trim()) merged.email = standard.email.trim();
  if (standard.password.trim()) merged.password = standard.password.trim();
  return merged;
}
