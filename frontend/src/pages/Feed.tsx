import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import AstronomicalEvents from "../components/AstronomicalEvents";
import { listArticles, Article, Freshness } from "../api/articles";

const STATE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Unread", value: "new" },
  { label: "Read", value: "read" },
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

export default function Feed() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [stateFilter, setStateFilter] = useState("");
  const [freshnessFilter, setFreshnessFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 20;
  const isInitialMount = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setOffset(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listArticles({
        state: stateFilter || undefined,
        freshness: freshnessFilter || undefined,
        q: searchQuery || undefined,
        limit,
        offset,
      });
      setArticles(data.articles);
      setTotal(data.total);
    } catch {
      setError("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  }, [stateFilter, freshnessFilter, searchQuery, offset]);

  useEffect(() => { void fetchArticles(); }, [fetchArticles]);

  useLayoutEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [articles]);

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
          <div className="filter-search">
            <input
              type="search"
              className="filter-search-input"
              placeholder="Search articles…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
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

        <AstronomicalEvents />

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
              {article.state !== "new" && (
                <span className="badge badge-read">read</span>
              )}
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
            Prev
          </button>
          <span className="pagination-info">{currentPage} / {totalPages}</span>
          <button
            className="btn"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
