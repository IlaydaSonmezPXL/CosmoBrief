import { useState, useEffect } from "react";
import Nav from "../components/Nav";
import apiClient from "../api/client";

interface AdminStats {
  total_users: number;
  total_explanations: number;
  explanations_by_mode: Record<string, number>;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  top_topics: Array<{ tag: string; article_count: number }>;
  ratings: { thumbs_up: number; thumbs_down: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get<AdminStats>("/admin/stats");
        setStats(data);
      } catch {
        setError("Failed to load admin stats.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="page">
      <Nav />
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Mission Control</h1>
          <p className="page-subtitle">System-wide statistics</p>
        </div>

        {loading && <p className="loading-text">Loading…</p>}
        {error && <p className="error-text">{error}</p>}

        {stats && (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total_users}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total_explanations}</div>
                <div className="stat-label">Explanations</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total_prompt_tokens.toLocaleString()}</div>
                <div className="stat-label">Prompt Tokens</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total_completion_tokens.toLocaleString()}</div>
                <div className="stat-label">Output Tokens</div>
              </div>
            </div>

            <div className="admin-section">
              <p className="admin-section-title">Explanations by Mode</p>
              {Object.entries(stats.explanations_by_mode).map(([mode, count]) => (
                <div key={mode} className="mode-row">
                  <span className="mode-name">{mode}</span>
                  <span className="mode-count">{count}</span>
                </div>
              ))}
            </div>

            <div className="admin-section">
              <p className="admin-section-title">Ratings</p>
              <div className="mode-row">
                <span className="mode-name">👍 Thumbs up</span>
                <span className="mode-count">{stats.ratings.thumbs_up}</span>
              </div>
              <div className="mode-row">
                <span className="mode-name">👎 Thumbs down</span>
                <span className="mode-count">{stats.ratings.thumbs_down}</span>
              </div>
            </div>

            {stats.top_topics.length > 0 && (
              <div className="admin-section">
                <p className="admin-section-title">Top Topics</p>
                {stats.top_topics.map(({ tag, article_count }) => (
                  <div key={tag} className="topic-row">
                    <span className="topic-name">{tag}</span>
                    <span className="topic-count">
                      {article_count} article{article_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
