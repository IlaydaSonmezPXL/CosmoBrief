import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

interface ReadingMapArticle {
  article_id: number;
  title: string;
  news_site: string | null;
  published_at: string | null;
}

interface Topic {
  tag: string;
  article_count: number;
  articles: ReadingMapArticle[];
}

interface ReadingMapResponse {
  user_id: string;
  topics: Topic[];
}

export default function ReadingMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const { data } = await apiClient.get<ReadingMapResponse>(`/users/${user!.userId}/reading-map`);
        setTopics(data.topics);
      } catch {
        setError("Failed to load reading map.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  function toggleTag(tag: string) {
    setExpanded((prev) => (prev === tag ? null : tag));
  }

  return (
    <div className="page">
      <Nav />
      <div className="container container-sm">
        <div className="page-header">
          <h1 className="page-title">Reading Map</h1>
          <p className="page-subtitle">Topics from your AI-explained articles</p>
        </div>

        {loading && <p className="loading-text">Loading…</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && topics.length === 0 && (
          <p className="loading-text">
            No topics yet. Read articles and request explanations to build your map.
          </p>
        )}

        <div className="topic-list">
          {topics.map(({ tag, article_count, articles }) => (
            <div key={tag}>
              <div
                className="topic-tag-row"
                onClick={() => toggleTag(tag)}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <span className="topic-tag-name">{tag}</span>
                <span className="topic-tag-count" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {article_count} article{article_count !== 1 ? "s" : ""}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                    {expanded === tag ? "▲" : "▼"}
                  </span>
                </span>
              </div>

              {expanded === tag && (
                <div style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderTop: "none",
                  borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                  marginBottom: "0.5rem",
                }}>
                  {articles.map((a) => (
                    <div
                      key={a.article_id}
                      onClick={() => navigate(`/articles/${a.article_id}`)}
                      style={{
                        padding: "0.65rem 1rem",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontSize: "0.875rem", color: "var(--text)", marginBottom: "0.15rem" }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {a.news_site}
                        {a.published_at && ` · ${new Date(a.published_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
