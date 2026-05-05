import apiClient from "./client";

export interface UserMe {
  user_id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UpdateMePayload {
  current_password: string;
  new_username?: string;
  new_email?: string;
  new_password?: string;
}

export function getMe() {
  return apiClient.get<UserMe>("/users/me");
}

export function updateMe(payload: UpdateMePayload) {
  return apiClient.patch<UserMe>("/users/me", payload);
}

export function wipeUserData() {
  return apiClient.delete("/users/me/data");
}
