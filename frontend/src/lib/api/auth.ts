import { apiClient } from "@/lib/api/client";
import type { User } from "@/store/slices/auth-slice";

const AUTH_BASE = "/api/v1/auth";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_name?: string;
  organization_slug?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export function register(data: RegisterRequest): Promise<TokenResponse> {
  return apiClient<TokenResponse>(`${AUTH_BASE}/register`, {
    method: "POST",
    body: data,
  });
}

export function login(data: LoginRequest): Promise<TokenResponse> {
  return apiClient<TokenResponse>(`${AUTH_BASE}/login/json`, {
    method: "POST",
    body: data,
  });
}

export function getCurrentUser(token: string): Promise<User> {
  return apiClient<User>(`${AUTH_BASE}/me`, {
    method: "GET",
    token,
  });
}
