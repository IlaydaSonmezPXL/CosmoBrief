import apiClient from "./client";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
}

export function register(username: string, email: string, password: string) {
  return apiClient.post<TokenResponse>("/auth/register", { username, email, password });
}

export function login(username: string, password: string) {
  return apiClient.post<TokenResponse>("/auth/login", { username, password });
}
