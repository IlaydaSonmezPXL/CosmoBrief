import apiClient from "./client";

export type ArticleState = "new" | "read" | "explained";
export type Freshness = "fresh" | "aging" | "archived";

export interface ExplanationStatus {
  available: boolean;
  latest_version: number | null;
  needs_regeneration: boolean;
  rating: "up" | "down" | null;
}

export interface Article {
  article_id: number;
  title: string;
  summary: string | null;
  news_site: string | null;
  published_at: string | null;
  url: string | null;
  image_url: string | null;
  freshness: Freshness;
  state: ArticleState;
}

export interface ArticleDetail extends Article {
  explanations: Record<string, ExplanationStatus>;
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  limit: number;
  offset: number;
}

export interface TopicCount {
  tag: string;
  count: number;
}

export interface ArticleTopicsResponse {
  topics: TopicCount[];
}

export function listArticles(params?: {
  state?: string;
  freshness?: string;
  topic?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  return apiClient.get<ArticleListResponse>("/articles", { params });
}

export function getArticleTopics() {
  return apiClient.get<ArticleTopicsResponse>("/articles/topics");
}

export function getArticle(articleId: number) {
  return apiClient.get<ArticleDetail>(`/articles/${articleId}`);
}

