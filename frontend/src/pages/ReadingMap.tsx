import React, { useState, useEffect, useMemo, useRef } from "react";
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

function hashStr(s: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

const SVG_W = 1280;
const SVG_H = 440;
const PAD_X = 100;
const PAD_Y = 65;

function getStarPos(tag: string) {
  const hx = hashStr(tag, 0x12345678);
  const hy = hashStr(tag, 0x87654321);
  return {
    x: PAD_X + (hx / 0xffffffff) * (SVG_W - PAD_X * 2),
    y: PAD_Y + (hy / 0xffffffff) * (SVG_H - PAD_Y * 2),
  };
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed background stars — absolute SVG px coords, never panned (parallax backdrop)
const BG_STARS = (() => {
  const rand = mulberry32(0xdeadbeef);
  return Array.from({ length: 90 }, () => ({
    x: rand() * SVG_W,
    y: rand() * SVG_H,
    r: 0.3 + rand() * 1.1,
    opLo: 0.04 + rand() * 0.10,
    opHi: 0.20 + rand() * 0.48,
    dur: 3.5 + rand() * 7.5,
    del: rand() * 6,
  }));
})();

function getConnections(stars: Array<{ x: number; y: number }>) {
  const pairs = new Set<string>();
  const result: Array<[number, number]> = [];
  const MAX_DIST = 320;

  stars.forEach((a, i) => {
    const nearest = stars
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(({ j, d }) => j !== i && d < MAX_DIST)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);

    nearest.forEach(({ j }) => {
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (!pairs.has(key)) {
        pairs.add(key);
        result.push([i, j]);
      }
    });
  });

  return result;
}

export default function ReadingMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const hasDragged = useRef(false);

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

  const stars = useMemo(
    () => topics.map((t) => ({ ...t, ...getStarPos(t.tag) })),
    [topics]
  );

  const connections = useMemo(() => getConnections(stars), [stars]);

  const selectedTopic = topics.find((t) => t.tag === selected) ?? null;

  function starRadius(count: number) {
    return Math.min(7 + count * 2.5, 16);
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    hasDragged.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    setIsDragging(true);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }

  function handleMouseUp() {
    setIsDragging(false);
    dragStart.current = null;
  }

  function handleStarClick(tag: string) {
    if (hasDragged.current) return;
    setSelected((prev) => (prev === tag ? null : tag));
  }

  return (
    <div className="page">
      <Nav />

      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Reading Map</h1>
          <p className="page-subtitle">
            {topics.length > 0
              ? `${topics.length} topic${topics.length !== 1 ? "s" : ""} charted · drag to explore`
              : "Request AI explanations to chart your constellation"}
          </p>
        </div>
        {loading && <p className="loading-text">Loading…</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      {!loading && !error && (
        <>
          <div className="constellation-wrap" style={{
            padding: "0 1.5rem",
            maxWidth: expanded ? "100%" : "72%",
            margin: "0 auto",
            transition: "max-width 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div style={{
              position: "relative",
              paddingBottom: expanded ? "34.375%" : "26%",
              transition: "padding-bottom 0.4s cubic-bezier(0.4,0,0.2,1)",
              overflow: "hidden",
              borderRadius: "10px",
              border: "1px solid #1a2540",
            }}>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="xMidYMid slice"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
              }}
              aria-label="Topic constellation"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                <filter id="glow-sm" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-lg" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="bg-grad" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#0d1829" />
                  <stop offset="100%" stopColor="#07090f" />
                </radialGradient>
              </defs>

              {/* Static background — never pans */}
              <rect width={SVG_W} height={SVG_H} fill="url(#bg-grad)" />

              {/* Fixed background micro-stars — parallax backdrop, not panned */}
              {BG_STARS.map((s, i) => (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill="white"
                  className="bg-star"
                  style={{
                    '--op-lo': s.opLo,
                    '--op-hi': s.opHi,
                    '--dur': `${s.dur}s`,
                    '--del': `${s.del}s`,
                  } as React.CSSProperties}
                />
              ))}

              {/* Empty state */}
              {topics.length === 0 && (
                <text
                  x={SVG_W / 2}
                  y={SVG_H / 2 - 10}
                  textAnchor="middle"
                  fill="#3f4e66"
                  fontSize="14"
                  fontFamily="Space Grotesk, sans-serif"
                >
                  No topics yet — open articles and request AI explanations
                </text>
              )}

              {/* Pannable constellation — lines + topic stars move together */}
              <g transform={`translate(${pan.x}, ${pan.y})`}>
                {connections.map(([i, j]) => {
                  const a = stars[i];
                  const b = stars[j];
                  const isActive = selected === a.tag || selected === b.tag;
                  return (
                    <line
                      key={`${i}-${j}`}
                      x1={a.x} y1={a.y}
                      x2={b.x} y2={b.y}
                      stroke={isActive ? "rgba(34,211,238,0.45)" : "rgba(34,211,238,0.12)"}
                      strokeWidth={isActive ? 1.2 : 0.7}
                      strokeDasharray={isActive ? "none" : "4 6"}
                      style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                    />
                  );
                })}

                {stars.map((star, idx) => {
                  const r = starRadius(star.article_count);
                  const isSelected = selected === star.tag;
                  return (
                    <g
                      key={star.tag}
                      onClick={() => handleStarClick(star.tag)}
                      style={{
                        cursor: "pointer",
                        animation: `fadeIn 0.5s ease-out ${idx * 0.07}s both`,
                      }}
                    >
                      {isSelected && (
                        <circle
                          cx={star.x}
                          cy={star.y}
                          r={r + 8}
                          fill="none"
                          stroke="rgba(34,211,238,0.25)"
                          strokeWidth="1.5"
                          className="star-ring"
                        />
                      )}

                      <circle
                        cx={star.x}
                        cy={star.y}
                        r={r + 4}
                        fill={isSelected ? "rgba(34,211,238,0.12)" : "rgba(34,211,238,0.05)"}
                        filter="url(#glow-sm)"
                        style={{ transition: "fill 0.3s" }}
                      />

                      <circle
                        cx={star.x}
                        cy={star.y}
                        r={r}
                        fill={isSelected ? "#22d3ee" : "#4f9cf9"}
                        filter={isSelected ? "url(#glow-lg)" : "url(#glow-sm)"}
                        className={isSelected ? "star-selected" : "star-idle"}
                        style={{ transition: "fill 0.3s, r 0.3s" }}
                      />

                      {star.article_count > 1 && (
                        <text
                          x={star.x}
                          y={star.y + r * 0.38}
                          textAnchor="middle"
                          fill={isSelected ? "#07090f" : "rgba(255,255,255,0.7)"}
                          fontSize={Math.max(7, r * 0.7)}
                          fontFamily="Orbitron, sans-serif"
                          fontWeight="700"
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {star.article_count}
                        </text>
                      )}

                      <text
                        x={star.x}
                        y={star.y + r + 16}
                        textAnchor="middle"
                        fill={isSelected ? "#22d3ee" : "#7e8fa8"}
                        fontSize="11"
                        fontFamily="Space Grotesk, sans-serif"
                        fontWeight={isSelected ? "700" : "500"}
                        letterSpacing="0.04em"
                        style={{
                          pointerEvents: "none",
                          userSelect: "none",
                          transition: "fill 0.3s",
                          textTransform: "uppercase",
                        }}
                      >
                        {star.tag}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
            <button
              className="btn btn-ghost"
              style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 2 }}
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
            <button
              className="btn btn-ghost"
              style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", zIndex: 2 }}
              onClick={() => setPan({ x: 0, y: 0 })}
            >
              Reset
            </button>
            </div>
          </div>

          {selectedTopic && (
            <div className="container" style={{ paddingTop: "1rem" }}>
              <div className="constellation-panel" key={selectedTopic.tag}>
                <div className="constellation-panel-header">
                  <span className="constellation-panel-title">{selectedTopic.tag}</span>
                  <span className="constellation-panel-count">
                    {selectedTopic.article_count} article{selectedTopic.article_count !== 1 ? "s" : ""}
                  </span>
                </div>
                {selectedTopic.articles.map((a) => (
                  <div
                    key={a.article_id}
                    className="constellation-article"
                    onClick={() => navigate(`/articles/${a.article_id}`)}
                  >
                    <div className="constellation-article-title">{a.title}</div>
                    <div className="constellation-article-meta">
                      {a.news_site}
                      {a.published_at && ` · ${new Date(a.published_at).toLocaleDateString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
