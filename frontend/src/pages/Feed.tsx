import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { listArticles, Article, ArticleState, Freshness } from "../api/articles";

const STATE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Read", value: "read" },
  { label: "Explained", value: "explained" },
  { label: "Saved", value: "saved" },
  { label: "Dismissed", value: "dismissed" },
];

const FRESHNESS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Any", value: "" },
  { label: "Fresh", value: "fresh" },
  { label: "Aging", value: "aging" },
  { label: "Archived", value: "archived" },
];

const FRESHNESS_CLASS: Record<Freshness, string> = {
  fresh: "badge badge-fresh",
  aging: "badge badge-aging",
  archived: "badge badge-archived",
};

const STATE_CLASS: Record<ArticleState, string> = {
  new: "badge badge-new",
  read: "badge badge-read",
  explained: "badge badge-explained",
  saved: "badge badge-saved",
  dismissed: "badge badge-dismissed",
};

export default function Feed() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [stateFilter, setStateFilter] = useState("");
  const [freshnessFilter, setFreshnessFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 20;

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listArticles({
        state: stateFilter || undefined,
        freshness: freshnessFilter || undefined,
        limit,
        offset,
      });
      const visible = stateFilter === ""
        ? data.articles.filter((a) => a.state !== "dismissed")
        : data.articles;
      setArticles(visible);
      setTotal(data.total);
    } catch {
      setError("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  }, [stateFilter, freshnessFilter, offset]);

  useEffect(() => { void fetchArticles(); }, [fetchArticles]);

  function handleFilterChange() { setOffset(0); }

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="page">
      <Nav />
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Space News Feed</h1>
          <p className="page-subtitle">{total} articles · updating every 15 minutes</p>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <span>State</span>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); handleFilterChange(); }}
            >
              {STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <span>Freshness</span>
            <select
              value={freshnessFilter}
              onChange={(e) => { setFreshnessFilter(e.target.value); handleFilterChange(); }}
            >
              {FRESHNESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading && <p className="loading-text">Loading…</p>}
        {error && <p className="error-text">{error}</p>}

        {articles.map((article) => (
          <div
            key={article.article_id}
            className="article-card"
            onClick={() => navigate(`/articles/${article.article_id}`)}
          >
            <div className="article-badges">
              <span className={FRESHNESS_CLASS[article.freshness]}>{article.freshness}</span>
              <span className={STATE_CLASS[article.state]}>{article.state}</span>
            </div>
            {article.image_url && (
              <img src={article.image_url} alt="" className="article-img" />
            )}
            <div className="article-title">{article.title}</div>
            <div className="article-meta">
              {article.news_site}
              {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString()}`}
            </div>
            {article.summary && <p className="article-summary">{article.summary}</p>}
          </div>
        ))}

        {!loading && articles.length === 0 && !error && (
          <p className="loading-text">No articles match the current filters.</p>
        )}

        <div className="pagination">
          <button
            className="btn"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            ← Prev
          </button>
          <span className="pagination-info">{currentPage} / {totalPages}</span>
          <button
            className="btn"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
