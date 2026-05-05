import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
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
  { key: "eli12",      label: "Like I'm 12"   },
  { key: "caveman",    label: "Caveman"        },
  { key: "alien",      label: "Alien"          },
  { key: "story",      label: "Story"          },
];

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

  if (loadingArticle) return (
    <div className="page"><Nav /><div className="container"><p className="loading-text">Loading…</p></div></div>
  );
  if (error || !article) return (
    <div className="page"><Nav /><div className="container"><p className="error-text">{error || "Article not found."}</p></div></div>
  );

  return (
    <div className="page">
      <Nav />
      <div className="container" style={{ maxWidth: 780 }}>
        <button className="btn btn-back" onClick={() => navigate(-1)} style={{ marginBottom: "1.5rem" }}>
          Back
        </button>

        <div className="detail-header">
          <h1 className="detail-title">{article.title}</h1>
          <p className="detail-meta">
            {article.news_site}
            {article.published_at && ` · ${new Date(article.published_at).toLocaleDateString()}`}
            {` · `}
            <span style={{ textTransform: "capitalize" }}>{article.freshness}</span>
            {article.state !== "new" && (
              <span style={{ marginLeft: "0.5rem" }}>
                <span className="badge badge-read">read</span>
              </span>
            )}
          </p>
          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem" }}>
              Read original →
            </a>
          )}
        </div>

        {article.image_url && (
          <img src={article.image_url} alt="" className="detail-img" />
        )}

        <p className="detail-summary">{article.summary}</p>

        <hr className="divider" />

        <p className="section-label">AI Explanations</p>
        <div className="mode-bar">
          {MODES.map(({ key, label }) => {
            const status = article.explanations[key];
            const badge = status?.available
              ? status.needs_regeneration ? " ↻" : " ✓"
              : "";
            return (
              <button
                key={key}
                className={`btn${activeMode === key ? " btn-active" : ""}`}
                onClick={() => handleExplain(key)}
              >
                {label}{badge}
              </button>
            );
          })}
        </div>

        {loadingExplanation && <p className="loading-text">Generating explanation…</p>}
        {explainError && <p className="error-text">{explainError}</p>}

        {explanation && !loadingExplanation && (
          <div className="explanation-panel">
            <div className="explanation-meta">
              v{explanation.version} · {new Date(explanation.generated_at).toLocaleString()} · {explanation.source}
            </div>
            <p className="explanation-text">{explanation.text}</p>
            <div className="explanation-actions">
              {explanation.rating ? (
                <>
                  <span className="rating-display">
                    Rated {explanation.rating === "up" ? "👍" : "👎"}
                  </span>
                  {explanation.rating === "down" && (
                    <button className="btn btn-ghost" onClick={() => handleExplain(activeMode!)}>
                      Regenerate
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => handleRate("up")}>👍</button>
                  <button className="btn" onClick={() => handleRate("down")}>👎</button>
                </>
              )}
              <button
                className="btn btn-ghost"
                onClick={handleShowHistory}
                style={{ marginLeft: "auto" }}
              >
                {showHistory ? "Hide history" : "History"}
              </button>
            </div>
          </div>
        )}

        {showHistory && history && (
          <div className="history-panel">
            <p className="section-label" style={{ marginBottom: "0.5rem" }}>Version history</p>
            {history.map((v) => (
              <div key={v.version} className="history-item">
                <div className="history-item-meta">
                  v{v.version} · {new Date(v.generated_at).toLocaleString()}
                  {v.rating && ` · ${v.rating === "up" ? "👍" : "👎"}`}
                  {v.needs_regeneration && " · needs regeneration"}
                </div>
                <p className="history-item-text">{v.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
