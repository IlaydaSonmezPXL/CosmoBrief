import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listArticles, getArticleTopics, Article, TopicCount } from "../api/articles";
import EditorialShell from "../components/EditorialShell";

const STATE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All",    value: "" },
  { label: "Unread", value: "new" },
  { label: "Read",   value: "read" },
];

const FRESHNESS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Any",      value: "" },
  { label: "Fresh",    value: "fresh" },
  { label: "Aging",    value: "aging" },
  { label: "Archived", value: "archived" },
];

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Feed() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [stateFilter, setStateFilter] = useState("");
  const [freshnessFilter, setFreshnessFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [topics, setTopics] = useState<TopicCount[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 20;
  const isInitialMount = useRef(true);

  useEffect(() => {
    getArticleTopics()
      .then(({ data }) => setTopics(data.topics))
      .catch(() => {});
  }, []);

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
        topic: topicFilter || undefined,
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
  }, [stateFilter, freshnessFilter, topicFilter, searchQuery, offset]);

  useEffect(() => { void fetchArticles(); }, [fetchArticles]);

  useLayoutEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [articles]);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;
  const activeStateLabel = STATE_OPTIONS.find((o) => o.value === stateFilter)?.label ?? "All";
  const activeFreshnessLabel = FRESHNESS_OPTIONS.find((o) => o.value === freshnessFilter)?.label ?? "Any";
  const freshCount = articles.filter((a) => a.freshness === "fresh").length;
  const unreadCount = articles.filter((a) => a.state === "new").length;
  const readCount = articles.filter((a) => a.state !== "new").length;

  return (
    <EditorialShell>
      <div className="browse-root">
        <header className="browse-head">
          <div className="browse-head-grid">
            <div>
              <div className="cb-section-num">§ · The Archive</div>
              <h1 className="browse-title">Browse the <em>signals</em>.</h1>
              <p className="browse-deck">
                {total} signals · updated every 15 minutes in the archive.
              </p>
            </div>
            <div className="browse-head-stats">
              <div><strong>{total}</strong><span>Signals</span></div>
              <div><strong>{freshCount}</strong><span>Fresh</span></div>
              <div><strong>{unreadCount}</strong><span>Unread</span></div>
              <div><strong>{readCount}</strong><span>Read</span></div>
            </div>
          </div>
        </header>

        <div className="browse-controls">
          <div className="browse-search">
            <span className="browse-search-label">Search</span>
            <input
              type="search"
              placeholder="Search the archive…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="browse-search-clear" onClick={() => setSearchInput("")}>
                Clear
              </button>
            )}
          </div>
          <div className="browse-sort">
            <span className="browse-sort-label">Sort</span>
            <div className="browse-sort-opts">
              <button className="active" disabled>Newest</button>
            </div>
          </div>
        </div>

        <div className="browse-facets">
          {topics.length > 0 && (
            <div className="browse-facet-row">
              <div className="browse-facet-label">Topic</div>
              <div className="browse-facet-chips">
                <button
                  className={`browse-facet-chip${topicFilter === "" ? " active" : ""}`}
                  onClick={() => { setTopicFilter(""); setOffset(0); }}
                >
                  All <span className="cnt">{total}</span>
                </button>
                {topics.map((t) => (
                  <button
                    key={t.tag}
                    className={`browse-facet-chip${topicFilter === t.tag ? " active" : ""}`}
                    onClick={() => { setTopicFilter(t.tag); setOffset(0); }}
                  >
                    {t.tag} <span className="cnt">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="browse-facet-row">
            <div className="browse-facet-label">State</div>
            <div className="browse-facet-chips">
              {STATE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`browse-facet-chip${stateFilter === o.value ? " active" : ""}`}
                  onClick={() => { setStateFilter(o.value); setOffset(0); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="browse-facet-row">
            <div className="browse-facet-label">Freshness</div>
            <div className="browse-facet-chips">
              {FRESHNESS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`browse-facet-chip${freshnessFilter === o.value ? " active" : ""}`}
                  onClick={() => { setFreshnessFilter(o.value); setOffset(0); }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="browse-list-wrap">
          <div className="browse-list-meta">
            <span>Showing <strong>{articles.length}</strong> of <em>{total}</em></span>
            <span>{activeStateLabel} · {activeFreshnessLabel}</span>
          </div>

          {loading && <div className="browse-loading">Loading…</div>}
          {error && <div className="browse-empty">{error}</div>}

          {!loading && !error && articles.length === 0 && (
            <div className="browse-empty">No articles match the current filters.</div>
          )}

          {!loading && !error && articles.length > 0 && (
            <ul className="browse-list">
              {articles.map((article, idx) => (
                <li
                  key={article.article_id}
                  className="browse-row"
                  onClick={() => navigate(`/articles/${article.article_id}`)}
                >
                  <div className="browse-row-num">{String(offset + idx + 1).padStart(3, "0")}</div>
                  <div className="browse-row-thumb">
                    {article.image_url ? (
                      <img src={article.image_url} alt="" loading="lazy" />
                    ) : (
                      <span>{article.news_site?.charAt(0).toUpperCase() ?? "S"}</span>
                    )}
                  </div>
                  <div className="browse-row-body">
                    <div className="browse-row-meta">
                      <span className={`browse-row-status ${article.freshness}`}>{article.freshness}</span>
                      <span className="dot">•</span>
                      <span>{article.news_site ?? "Space News"}</span>
                    </div>
                    <div className="browse-row-title">{article.title}</div>
                    {article.summary && <div className="browse-row-deck">{article.summary}</div>}
                  </div>
                  <div className="browse-row-aside">
                    <div className="browse-row-time">
                      {article.published_at ? formatTimeAgo(article.published_at) : "—"}
                    </div>
                    <div className={`browse-row-state${article.state !== "new" ? " read" : ""}`}>
                      {article.state === "new" ? "Unread" : "Read"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && total > limit && (
            <div className="browse-pagination">
              <button
                className="browse-pag-btn"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Prev
              </button>
              <div className="browse-pages">
                Page <strong>{currentPage}</strong> of {totalPages}
              </div>
              <button
                className="browse-pag-btn"
                disabled={offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </EditorialShell>
  );
}
