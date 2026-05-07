import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditorialShell from "../components/EditorialShell";
import { getArticle, ArticleDetail as ArticleDetailType } from "../api/articles";
import {
  requestExplanation,
  getExplanationHistory,
  rateExplanation,
  ExplanationMode,
  ExplanationResponse,
  ExplanationHistoryItem,
} from "../api/explanations";

const MODES: Array<{ key: ExplanationMode; label: string }> = [
  { key: "eli12",   label: "Like I'm 12" },
  { key: "caveman", label: "Caveman"     },
  { key: "alien",   label: "Alien"       },
  { key: "story",   label: "Story"       },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const articleId = Number(id);

  const [article, setArticle] = useState<ArticleDetailType | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [error, setError] = useState("");

  const [activeMode, setActiveMode] = useState<ExplanationMode | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explainError, setExplainError] = useState("");

  const [history, setHistory] = useState<ExplanationHistoryItem[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getArticle(articleId);
        setArticle(data);
      } catch {
        setError("Failed to load article.");
      } finally {
        setLoadingArticle(false);
      }
    }
    void load();
  }, [articleId]);

  async function handleExplain(mode: ExplanationMode) {
    setActiveMode(mode);
    setExplanation(null);
    setHistory(null);
    setShowHistory(false);
    setExplainError("");
    setLoadingExplanation(true);
    try {
      const { data } = await requestExplanation(articleId, mode);
      setExplanation(data);
      const { data: updated } = await getArticle(articleId);
      setArticle(updated);
    } catch {
      setExplainError("Failed to generate explanation.");
    } finally {
      setLoadingExplanation(false);
    }
  }

  async function handleRate(rating: "up" | "down") {
    if (!explanation || !activeMode) return;
    try {
      await rateExplanation(articleId, activeMode, explanation.version, rating);
      setExplanation({ ...explanation, rating });
      if (rating === "down" && article) {
        setArticle({
          ...article,
          explanations: {
            ...article.explanations,
            [activeMode]: { ...article.explanations[activeMode], needs_regeneration: true },
          },
        });
      }
    } catch {
      // already rated or not latest — ignore
    }
  }

  async function handleShowHistory() {
    if (!activeMode) return;
    if (showHistory) { setShowHistory(false); return; }
    try {
      const { data } = await getExplanationHistory(articleId, activeMode);
      setHistory(data.versions);
      setShowHistory(true);
    } catch {
      // ignore
    }
  }

  if (loadingArticle) {
    return (
      <EditorialShell>
        <div className="ed-light">
          <div className="ed-reading">
            <p className="ed-loading-text">Loading…</p>
          </div>
        </div>
      </EditorialShell>
    );
  }

  if (error || !article) {
    return (
      <EditorialShell>
        <div className="ed-light">
          <div className="ed-reading">
            <p className="ed-error-text">{error || "Article not found."}</p>
          </div>
        </div>
      </EditorialShell>
    );
  }

  return (
    <EditorialShell>
      <div className="ed-light">
        <div className="ed-reading">

        {/* Back navigation */}
        <button className="ed-article-back" onClick={() => navigate(-1)}>
          ← Back to browse
        </button>

        {/* Article header */}
        <div className="ed-article-kicker-line">
          <span className="hero-sep" />
          {article.news_site ?? "Space News"}
          {article.freshness && (
            <span className={`ed-fresh-${article.freshness}`}>· {article.freshness}</span>
          )}
        </div>

        <h1 className="ed-article-headline">{article.title}</h1>

        <div className="ed-article-byline">
          {article.news_site && <span>{article.news_site}</span>}
          {article.published_at && (
            <span>{formatDate(article.published_at)} · {formatTimeAgo(article.published_at)}</span>
          )}
          {article.state !== "new" && <span className="ed-state-read">· read</span>}
          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read original →
            </a>
          )}
        </div>

        {/* Hero image */}
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="ed-article-hero-img"
            loading="lazy"
          />
        )}

        {/* Summary / body */}
        {article.summary && (
          <p className="ed-article-summary">{article.summary}</p>
        )}

        <hr className="ed-divider" />

        {/* AI Briefing section */}
        <div className="ed-briefing-label">AI Briefing</div>

        <div className="ed-mode-bar">
          {MODES.map(({ key, label }) => {
            const status = article.explanations[key];
            const badge = status?.available
              ? status.needs_regeneration ? " ↻" : " ✓"
              : "";
            return (
              <button
                key={key}
                className={`ed-mode-btn${activeMode === key ? " active" : ""}`}
                onClick={() => { void handleExplain(key); }}
              >
                {label}{badge}
              </button>
            );
          })}
        </div>

        {loadingExplanation && (
          <p className="ed-loading-text">Generating explanation…</p>
        )}
        {explainError && (
          <p className="ed-error-text">{explainError}</p>
        )}

        {explanation && !loadingExplanation && (
          <div className="ed-explanation">
            <div className="ed-explanation-meta">
              v{explanation.version} · {new Date(explanation.generated_at).toLocaleString()} · {explanation.source}
            </div>
            <p className="ed-explanation-text">{explanation.text}</p>
            <div className="ed-explanation-actions">
              {explanation.rating ? (
                <>
                  <span className="ed-rating-display">
                    Rated {explanation.rating === "up" ? "👍" : "👎"}
                  </span>
                  {explanation.rating === "down" && (
                    <button
                      className="ed-action-ghost"
                      onClick={() => { void handleExplain(activeMode!); }}
                    >
                      Regenerate
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="ed-action-btn" onClick={() => { void handleRate("up"); }}>
                    👍
                  </button>
                  <button className="ed-action-btn" onClick={() => { void handleRate("down"); }}>
                    👎
                  </button>
                </>
              )}
              <button
                className="ed-action-ghost"
                onClick={() => { void handleShowHistory(); }}
                style={{ marginLeft: "auto" }}
              >
                {showHistory ? "Hide history" : "History"}
              </button>
            </div>
          </div>
        )}

        {showHistory && history && (
          <div className="ed-history">
            <div className="ed-history-title">Version history</div>
            {history.map((v) => (
              <div key={v.version} className="ed-history-item">
                <div className="ed-history-item-meta">
                  v{v.version} · {new Date(v.generated_at).toLocaleString()}
                  {v.rating && ` · ${v.rating === "up" ? "👍" : "👎"}`}
                  {v.needs_regeneration && " · needs regeneration"}
                </div>
                <p className="ed-history-item-text">{v.text}</p>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </EditorialShell>
  );
}
