import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { listArticles, Article } from "../api/articles";
import EditorialShell from "../components/EditorialShell";

interface AdminStats {
  total_users: number;
  total_explanations: number;
  explanations_by_mode: Record<string, number>;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  top_topics: Array<{ tag: string; article_count: number }>;
  ratings: { thumbs_up: number; thumbs_down: number };
}

interface AdminUser {
  user_id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  explanation_count: number;
}

interface AdminUsersResponse {
  users: AdminUser[];
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [errorStats, setErrorStats] = useState("");
  const [errorUsers, setErrorUsers] = useState("");
  const [errorArticles, setErrorArticles] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await apiClient.get<AdminStats>("/admin/stats");
        setStats(data);
      } catch {
        setErrorStats("Failed to load admin stats.");
      } finally {
        setLoadingStats(false);
      }
    }
    async function loadUsers() {
      try {
        const { data } = await apiClient.get<AdminUsersResponse>("/admin/users");
        setUsers(data.users);
      } catch {
        setErrorUsers("Failed to load subscribers.");
      } finally {
        setLoadingUsers(false);
      }
    }
    async function loadArticles() {
      try {
        const { data } = await listArticles({ limit: 10 });
        setArticles(data.articles);
      } catch {
        setErrorArticles("Failed to load recent signals.");
      } finally {
        setLoadingArticles(false);
      }
    }

    void loadStats();
    void loadUsers();
    void loadArticles();
  }, []);

  const totalTokens = stats ? stats.total_prompt_tokens + stats.total_completion_tokens : 0;
  const promptFlex = stats ? Math.max(stats.total_prompt_tokens, 1) : 1;
  const completionFlex = stats ? Math.max(stats.total_completion_tokens, 1) : 1;

  return (
    <EditorialShell>
      <div className="admin-root">
        <header className="admin-head">
          <div>
            <div className="cb-section-num">§ · Newsroom Desk</div>
            <h1 className="admin-title">Mission control for the <em>edition</em>.</h1>
            <p className="admin-deck">
              Monitor member activity, explanation usage, and the live signal queue.
            </p>
          </div>
          <div className="admin-head-stats">
            <div className="stat">
              <div className="lbl">Total users</div>
              <strong>{stats ? stats.total_users : "—"}</strong>
              <div className="trend">Active members</div>
            </div>
            <div className="stat">
              <div className="lbl">Explanations</div>
              <strong>{stats ? stats.total_explanations : "—"}</strong>
              <div className="trend">Lifetime</div>
            </div>
            <div className="stat">
              <div className="lbl">Prompt tokens</div>
              <strong>{stats ? stats.total_prompt_tokens.toLocaleString() : "—"}</strong>
              <div className="trend up">Inputs</div>
            </div>
            <div className="stat">
              <div className="lbl">Output tokens</div>
              <strong>{stats ? stats.total_completion_tokens.toLocaleString() : "—"}</strong>
              <div className="trend">Responses</div>
            </div>
          </div>
        </header>

        <section className="admin-col">
          <div className="admin-col-head">
            <div>
              <div className="cb-kicker">Token meter</div>
              <div className="admin-col-title">Explanation <em>usage</em>.</div>
            </div>
            <div className="admin-col-meta">
              <span className="pri">{totalTokens.toLocaleString()} tokens</span>
              Prompt + completion
            </div>
          </div>

          {loadingStats && <div className="admin-loading">Loading stats…</div>}
          {errorStats && <div className="admin-empty">{errorStats}</div>}

          {stats && (
            <div className="admin-meter">
              <div className="admin-meter-bar">
                <div className="seg seg-prompts" style={{ flex: promptFlex }}>
                  <em>Prompt</em>&nbsp;{stats.total_prompt_tokens.toLocaleString()}
                </div>
                <div className="seg seg-completions" style={{ flex: completionFlex }}>
                  <em>Output</em>&nbsp;{stats.total_completion_tokens.toLocaleString()}
                </div>
              </div>
              <div className="admin-meter-legend">
                <span><span className="sw" style={{ background: "var(--accent)" }} /> Prompt tokens</span>
                <span><span className="sw" style={{ background: "var(--gold)" }} /> Output tokens</span>
              </div>
            </div>
          )}
        </section>

        <section className="admin-col">
          <div className="admin-col-head">
            <div>
              <div className="cb-kicker">Subscribers</div>
              <div className="admin-col-title">Members on the <em>wire</em>.</div>
            </div>
            <div className="admin-col-meta">
              <span className="pri">{users.length} total</span>
              Latest signups
            </div>
          </div>

          {loadingUsers && <div className="admin-loading">Loading subscribers…</div>}
          {errorUsers && <div className="admin-empty">{errorUsers}</div>}
          {!loadingUsers && !errorUsers && users.length === 0 && (
            <div className="admin-empty">No members yet.</div>
          )}

          {!loadingUsers && !errorUsers && users.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Role</th>
                  <th className="r">Joined</th>
                  <th className="r">Explanations</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initial = (u.username?.[0] ?? "?").toUpperCase();
                  return (
                    <tr key={u.user_id}>
                      <td>
                        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                          <div className="admin-avatar">{initial}</div>
                          <div>
                            <span className="admin-u-name">{u.username}</span>
                            <span className="admin-u-email">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className={`admin-role ${u.role}`}>{u.role}</span></td>
                      <td className="r">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="r">{u.explanation_count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-col">
          <div className="admin-col-head">
            <div>
              <div className="cb-kicker">Signal queue</div>
              <div className="admin-col-title">Latest <em>signals</em> in cache.</div>
            </div>
            <div className="admin-col-meta">
              <span className="pri">{articles.length} showing</span>
              Freshness overview
            </div>
          </div>

          {loadingArticles && <div className="admin-loading">Loading signals…</div>}
          {errorArticles && <div className="admin-empty">{errorArticles}</div>}
          {!loadingArticles && !errorArticles && articles.length === 0 && (
            <div className="admin-empty">No cached signals yet.</div>
          )}

          {!loadingArticles && !errorArticles && articles.map((article, idx) => (
            <div
              key={article.article_id}
              className="admin-queue-item"
              onClick={() => navigate(`/articles/${article.article_id}`)}
            >
              <div className="qnum">{String(idx + 1).padStart(2, "0")}</div>
              <div>
                <div className="qmeta">
                  <span className={`qstatus ${article.freshness}`}>{article.freshness}</span>
                  <span className="qsite">{article.news_site ?? "Space News"}</span>
                </div>
                <div className="qtitle">{article.title}</div>
              </div>
              <div className="qtime">{formatTimeAgo(article.published_at)}</div>
            </div>
          ))}
        </section>
      </div>
    </EditorialShell>
  );
}
