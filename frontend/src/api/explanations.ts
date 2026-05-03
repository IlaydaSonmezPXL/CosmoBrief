import apiClient from "./client";

export type ExplanationMode = "eli12" | "caveman" | "scientist" | "story";

export interface ExplanationResponse {
  article_id: number;
  mode: ExplanationMode;
  version: number;
  text: string;
  generated_at: string;
  rating: "up" | "down" | null;
  source: "cached" | "generated";
}

export interface ExplanationHistoryItem {
  version: number;
  text: string;
  generated_at: string;
  rating: "up" | "down" | null;
  needs_regeneration: boolean;
}

export interface ExplanationHistoryResponse {
  article_id: number;
  mode: ExplanationMode;
  versions: ExplanationHistoryItem[];
}

export function requestExplanation(articleId: number, mode: ExplanationMode) {
  return apiClient.post<ExplanationResponse>(`/articles/${articleId}/explanations`, { mode });
}

export function getExplanationHistory(articleId: number, mode: ExplanationMode) {
  return apiClient.get<ExplanationHistoryResponse>(
    `/articles/${articleId}/explanations/${mode}/history`
  );
}

export function rateExplanation(
  articleId: number,
  mode: ExplanationMode,
  version: number,
  rating: "up" | "down"
) {
  return apiClient.post(`/articles/${articleId}/explanations/${mode}/${version}/rating`, { rating });
}
