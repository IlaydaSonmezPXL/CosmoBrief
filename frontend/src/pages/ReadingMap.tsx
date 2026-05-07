import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EditorialShell from "../components/EditorialShell";
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

const PALETTE = ["#e8542c", "#4ec5cf", "#d4a64a", "#8a6dbf", "#7eb09b", "#c97b89"];

function hashStr(s: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getStarPos(tag: string): { x: number; y: number } {
  const hx = hashStr(tag, 0x12345678);
  const hy = hashStr(tag, 0x87654321);
  return {
    x: 8 + (hx / 0xffffffff) * 84,
    y: 8 + (hy / 0xffffffff) * 84,
  };
}

function getMag(count: number): 1 | 2 | 3 {
  if (count >= 10) return 1;
  if (count >= 4) return 2;
  return 3;
}

function starRadius(count: number, mag: 1 | 2 | 3): number {
  return Math.max(5, 8 - mag * 1.5 + Math.sqrt(count));
}

type StarData = Topic & { x: number; y: number; mag: 1 | 2 | 3; color: string; cx: number; cy: number };

// Separation runs in SVG pixel space (600×480) so minDist is real pixels,
// accounting for the non-square pct→SVG mapping (x*6, y*4.8).
function separatePositions(positions: Array<{ x: number; y: number }>, minDistPx: number, iterations: number) {
  const X_SCALE = 6, Y_SCALE = 4.8;
  const pts = positions.map((p) => ({ x: p.x * X_SCALE, y: p.y * Y_SCALE }));
  const xMin = 8 * X_SCALE, xMax = 92 * X_SCALE;
  const yMin = 8 * Y_SCALE, yMax = 92 * Y_SCALE;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistPx && dist > 0.001) {
          const push = (minDistPx - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          pts[i].x = Math.max(xMin, Math.min(xMax, pts[i].x - nx * push));
          pts[i].y = Math.max(yMin, Math.min(yMax, pts[i].y - ny * push));
          pts[j].x = Math.max(xMin, Math.min(xMax, pts[j].x + nx * push));
          pts[j].y = Math.max(yMin, Math.min(yMax, pts[j].y + ny * push));
        }
      }
    }
  }

  return pts.map((p) => ({ x: p.x / X_SCALE, y: p.y / Y_SCALE }));
}

function getConnections(stars: StarData[]): Array<[number, number]> {
  const pairs = new Set<string>();
  const result: Array<[number, number]> = [];
  const MAX_DIST = 40;
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

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const { data } = await apiClient.get<ReadingMapResponse>(`/users/${user!.userId}/reading-map`);
        setTopics(data.topics);
        if (data.topics.length > 0) setSelected(data.topics[0].tag);
      } catch {
        setError("Failed to load reading map.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  const stars: StarData[] = useMemo(() => {
    const rawPositions = topics.map((t) => getStarPos(t.tag));
    const separated = separatePositions(rawPositions, 120, 100);
    return topics.map((t, idx) => {
      const pos = separated[idx];
      const mag = getMag(t.article_count);
      return {
        ...t,
        x: pos.x, y: pos.y,
        mag,
        color: PALETTE[idx % PALETTE.length],
        cx: pos.x * 6,
        cy: pos.y * 4.8,
      };
    });
  }, [topics]);

  const connections = useMemo(() => getConnections(stars), [stars]);

  const selectedStar = stars.find((s) => s.tag === selected) ?? null;
  const totalReads = topics.reduce((s, t) => s + t.article_count, 0);
  const maxCount = Math.max(...topics.map((t) => t.article_count), 1);

  return (
    <EditorialShell>
      <div className="map-root">
        <header className="map-head">
          <div>
            <div className="cb-section-num">§ · Reading Map</div>
            <h1 className="map-title">A <em>constellation</em> of what you&apos;ve actually read.</h1>
            <p className="map-deck">
              Each star is a topic; size scales with reads. Lines connect co-read topics.
              {topics.length > 0 ? " Pick a star to open its file." : " Request AI explanations to chart your constellation."}
            </p>
          </div>
          <div className="map-head-stats">
            <div><strong>{totalReads}</strong><span>reads · 30d</span></div>
            <div><strong>{topics.length}</strong><span>topics charted</span></div>
            <div><strong>{selectedStar ? selectedStar.article_count : "—"}</strong><span>focused reads</span></div>
            <div><strong>{selectedStar ? selectedStar.tag : "none"}</strong><span>focus topic</span></div>
          </div>
        </header>

        {loading && <p className="map-empty">Loading…</p>}
        {error && <p className="map-empty">{error}</p>}

        {!loading && !error && (
          <>
            <main className="map-grid">
              <section className="map-canvas">
                <div className="map-canvas-meta">
                  <span className="cb-kicker naked">Constellation · last 30 nights</span>
                  <span className="map-canvas-coords">
                    {selectedStar ? `Focus: ${selectedStar.tag}` : "Select a topic"}
                  </span>
                </div>

                <svg viewBox="0 0 600 480" className="map-svg" aria-label="Topic constellation">
                  <defs>
                    <radialGradient id="map-glow-active" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="rgba(232,84,44,0.18)" />
                      <stop offset="100%" stopColor="rgba(232,84,44,0)" />
                    </radialGradient>
                    <pattern id="map-grid-pat" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(244,237,224,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>

                  {/* grid + guides */}
                  <rect width="600" height="480" fill="url(#map-grid-pat)" />
                  {[80, 160, 240].map((r, i) => (
                    <circle key={i} cx="300" cy="240" r={r} fill="none" stroke="rgba(244,237,224,0.06)" strokeDasharray="2 6" />
                  ))}
                  <line x1="0" y1="240" x2="600" y2="240" stroke="rgba(244,237,224,0.06)" strokeDasharray="2 6" />
                  <line x1="300" y1="0" x2="300" y2="480" stroke="rgba(244,237,224,0.06)" strokeDasharray="2 6" />

                  {topics.length === 0 && (
                    <text x="300" y="235" textAnchor="middle" fill="rgba(244,237,224,0.25)" fontSize="13" fontFamily="'Space Grotesk', sans-serif">
                      No topics yet — open articles and request AI explanations
                    </text>
                  )}

                  {/* connecting lines */}
                  {connections.map(([i, j]) => {
                    const a = stars[i];
                    const b = stars[j];
                    const isActive = selected === a.tag || selected === b.tag;
                    return (
                      <line
                        key={`${i}-${j}`}
                        x1={a.cx} y1={a.cy}
                        x2={b.cx} y2={b.cy}
                        stroke={isActive ? "rgba(232,84,44,0.5)" : "rgba(244,237,224,0.12)"}
                        strokeWidth="1"
                        style={{ transition: "stroke 0.25s" }}
                      />
                    );
                  })}

                  {/* stars */}
                  {stars.map((star) => {
                    const r = starRadius(star.article_count, star.mag);
                    const isSelected = selected === star.tag;
                    return (
                      <g
                        key={star.tag}
                        className="map-star"
                        onClick={() => setSelected(star.tag)}
                        style={{ cursor: "pointer" }}
                      >
                        {isSelected && (
                          <circle cx={star.cx} cy={star.cy} r={r + 28} fill="url(#map-glow-active)" />
                        )}
                        <circle
                          cx={star.cx} cy={star.cy} r={r + 10}
                          fill="none"
                          stroke={star.color}
                          strokeOpacity={isSelected ? 0.6 : 0.18}
                          strokeWidth="1"
                          style={{ transition: "stroke-opacity 0.25s" }}
                        />
                        <circle
                          cx={star.cx} cy={star.cy} r={r}
                          fill={star.color}
                          opacity={isSelected ? 1 : 0.85}
                        >
                          <animate
                            attributeName="opacity"
                            values={isSelected ? "1;0.7;1" : "0.85;1;0.85"}
                            dur={`${4 + star.mag}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                        <text
                          x={star.cx} y={star.cy - r - 10}
                          textAnchor="middle"
                          fontFamily="'JetBrains Mono', monospace"
                          fontSize="9"
                          letterSpacing="2"
                          fill="rgba(244,237,224,0.45)"
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          ·{String(star.article_count).padStart(2, "0")}·
                        </text>
                        <text
                          x={star.cx} y={star.cy + r + 20}
                          textAnchor="middle"
                          fontFamily="'Fraunces', serif"
                          fontStyle="italic"
                          fontSize={isSelected ? "18" : "14"}
                          fontWeight="500"
                          fill={isSelected ? "var(--paper)" : "var(--paper-dim)"}
                          style={{ pointerEvents: "none", userSelect: "none", transition: "font-size 0.25s, fill 0.25s" }}
                        >
                          {star.tag}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="map-canvas-legend">
                  <span><span className="dot" style={{ background: "var(--accent)" }} /> selected</span>
                  <span><span className="dot small" /> read count</span>
                  <span><span className="line" /> co-read topics</span>
                </div>
              </section>

              <aside className="map-panel">
                {selectedStar ? (
                  <>
                    <div className="map-panel-head">
                      <div
                        className="cb-section-num"
                        style={{ color: selectedStar.color, "--panel-dot-color": selectedStar.color } as React.CSSProperties}
                      >
                        § Topic file
                      </div>
                      <div className="map-panel-title" style={{ color: selectedStar.color }}>
                        {selectedStar.tag}
                      </div>
                      <div className="map-panel-stats">
                        <div>
                          <strong>{selectedStar.article_count}</strong>
                          <span>reads · 30d</span>
                        </div>
                        <div>
                          <strong style={{ color: "var(--mute)" }}>—</strong>
                          <span>trend</span>
                        </div>
                        <div>
                          <strong>{selectedStar.articles.length}</strong>
                          <span>threads</span>
                        </div>
                      </div>
                    </div>

                    <div className="map-threads">
                      <h4>Threads in this file</h4>
                      <ul>
                        {selectedStar.articles.map((a, i) => (
                          <li
                            key={a.article_id}
                            className="map-thread-item"
                            onClick={() => navigate(`/articles/${a.article_id}`)}
                          >
                            <span className="num">{String(i + 1).padStart(2, "0")}</span>
                            <span className="lbl">{a.title}</span>
                            <span className="cnt">1</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="map-panel-empty">Select a topic star to open its file.</div>
                )}
              </aside>
            </main>

            {topics.length > 0 && (
              <section className="map-strip">
                <div className="cb-kicker">All topics · pick to inspect</div>
                <div className="map-strip-rows">
                  {stars.map((star) => {
                    const pct = Math.max((star.article_count / maxCount) * 100, 6);
                    return (
                      <button
                        key={star.tag}
                        type="button"
                        className={`map-strip-row${selected === star.tag ? " active" : ""}`}
                        onClick={() => setSelected(star.tag)}
                      >
                        <span className="swatch" style={{ background: star.color }} />
                        <span className="name">{star.tag}</span>
                        <span className="bar"><span style={{ width: `${pct}%`, background: star.color }} /></span>
                        <span className="count">{star.article_count}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {topics.length === 0 && (
              <div className="map-empty">No topics yet — start reading and request AI explanations to build your constellation.</div>
            )}
          </>
        )}
      </div>
    </EditorialShell>
  );
}
