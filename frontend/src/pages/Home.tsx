import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listArticles, type Article } from "../api/articles";
import { getAstronomicalEvents, type AstronomicalEvent } from "../api/astronomical";
import apiClient from "../api/client";
import EditorialShell from "../components/EditorialShell";

// ── Local types ──────────────────────────────────────────────────────────────

interface Topic {
  tag: string;
  article_count: number;
}

interface StatsData {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastWonDate: string;
  lastPlayedDate: string;
  distribution: Record<number, number>;
}

interface GameState {
  guesses: string[];
  results: Array<string[]>;
  gameOver: boolean;
  won: boolean;
  date: string;
}

interface StoredLocation {
  lat: number;
  lon: number;
  name: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TOPIC_COLORS = ["#e8542c", "#4ec5cf", "#d4a64a", "#8a6dbf", "#7eb09b", "#c97b89"];

const SPACE_QUOTES = [
  { text: "The cosmos is within us. We are made of star-stuff.", attr: "— Carl Sagan, Cosmos" },
  { text: "The universe is under no obligation to make sense to you.", attr: "— Neil deGrasse Tyson" },
  { text: "The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever.", attr: "— Konstantin Tsiolkovsky" },
  { text: "Equipped with his five senses, man explores the universe around him and calls the adventure science.", attr: "— Edwin Hubble" },
  { text: "Somewhere, something incredible is waiting to be known.", attr: "— Carl Sagan" },
  { text: "We are all connected. To each other, biologically. To the Earth, chemically. To the rest of the universe, atomically.", attr: "— Neil deGrasse Tyson" },
  { text: "The universe is not only queerer than we suppose, but queerer than we can suppose.", attr: "— J.B.S. Haldane" },
];

const GLYPH_MAP: Record<string, string> = {
  meteor_shower: "η",
  planet:        "♃",
  eclipse:       "◎",
  solstice:      "✷",
  moon:          "◐",
};

const TYPE_LABEL: Record<string, string> = {
  meteor_shower: "Meteor Shower",
  planet:        "Planet · Tonight",
  eclipse:       "Eclipse",
  solstice:      "Solstice / Equinox",
  moon:          "Moon Phase",
};

const SECTIONS = [
  { id: "top",    label: "The Edition" },
  { id: "sky",    label: "Tonight's Sky" },
  { id: "long",   label: "Long Reads" },
  { id: "wire",   label: "The Wire" },
  { id: "orbit",  label: "Reading Orbit" },
  { id: "wordle", label: "Daily Cipher" },
];

const LS_LOC_KEY = "cosmo_location";

// Static mini board fallback — decorative editorial visual
const STATIC_BOARD: Array<{ letters: string; states: string[] }> = [
  { letters: "ORBIT", states: ["absent", "absent", "absent", "absent", "absent"] },
  { letters: "SPACE", states: ["correct", "absent", "absent", "absent", "present"] },
  { letters: "PLUTO", states: ["correct", "correct", "correct", "correct", "correct"] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildCalendarUrl(ev: AstronomicalEvent): string {
  const base = ev.date.replace(/-/g, "");
  const text = encodeURIComponent(ev.name);
  const details = encodeURIComponent(
    `${ev.description}${ev.direction ? ` Look: ${ev.direction}` : ""}${ev.time_hint ? ` · ${ev.time_hint}` : ""}`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${base}/${base}&details=${details}`;
}

async function geocodeCity(city: string): Promise<StoredLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      name: data[0].display_name.split(",").slice(0, 2).join(", "),
    };
  } catch {
    return null;
  }
}

// ── Donut SVG helpers ────────────────────────────────────────────────────────

const CX = 180, CY = 180, R_OUTER = 150, R_INNER = 90;

function polar(angle: number, r: number): [number, number] {
  const a = (angle - 90) * Math.PI / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function arcPath(start: number, end: number, rO: number, rI: number): string {
  const [x1, y1] = polar(start, rO);
  const [x2, y2] = polar(end, rO);
  const [x3, y3] = polar(end, rI);
  const [x4, y4] = polar(start, rI);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rO} ${rO} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${rI} ${rI} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [miniBoard, setMiniBoard] = useState<Array<{ letters: string; states: string[] }>>(STATIC_BOARD);
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [locationEdit, setLocationEdit] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [geoWorking, setGeoWorking] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [activeSection, setActiveSection] = useState("top");
  const [now, setNow] = useState(new Date());

  const cityInputRef = useRef<HTMLInputElement>(null);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch articles
  useEffect(() => {
    listArticles({ limit: 20 })
      .then(({ data }) => {
        setArticles(data.articles);
        setTotal(data.total);
      })
      .catch(() => {});
  }, []);

  // Fetch reading map
  useEffect(() => {
    if (!user) return;
    apiClient
      .get<{ topics: Topic[] }>(`/users/${user.userId}/reading-map`)
      .then(({ data }) => setTopics(data.topics ?? []))
      .catch(() => {});
  }, [user]);

  // Wordle stats + today's game state
  useEffect(() => {
    if (!user) return;
    const rawStats = localStorage.getItem(`wordle_stats_${user.userId}`);
    if (rawStats) {
      try { setStats(JSON.parse(rawStats) as StatsData); } catch { /* noop */ }
    }
    const today = new Date().toISOString().slice(0, 10);
    const rawGame = localStorage.getItem(`wordle_${user.userId}_${today}`);
    if (rawGame) {
      try {
        const gs = JSON.parse(rawGame) as GameState;
        if (gs.guesses && gs.results && gs.guesses.length > 0) {
          const rows = gs.guesses.map((g: string, i: number) => ({
            letters: g,
            states: (gs.results[i] ?? Array(5).fill("absent")) as string[],
          }));
          setMiniBoard(rows);
        }
      } catch { /* noop */ }
    }
  }, [user]);

  // Location initialisation
  useEffect(() => {
    const saved = localStorage.getItem(LS_LOC_KEY);
    if (saved) {
      try { setLocation(JSON.parse(saved) as StoredLocation); return; } catch { /* noop */ }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: StoredLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: "Your Location" };
          localStorage.setItem(LS_LOC_KEY, JSON.stringify(loc));
          setLocation(loc);
        },
        () => setLocationEdit(true),
        { timeout: 6000 }
      );
    } else {
      setLocationEdit(true);
    }
  }, []);

  // Fetch events when location ready
  useEffect(() => {
    if (!location) return;
    getAstronomicalEvents(location.lat, location.lon)
      .then(({ data }) => setEvents(data.events))
      .catch(() => {});
  }, [location]);

  // Focus city input when edit opens
  useEffect(() => {
    if (locationEdit) cityInputRef.current?.focus();
  }, [locationEdit]);

  // IntersectionObserver for sticky nav active state
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: [0, 0.1, 0.4] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    const city = cityInput.trim();
    if (!city) return;
    setGeoWorking(true);
    setGeoError("");
    const result = await geocodeCity(city);
    setGeoWorking(false);
    if (!result) { setGeoError("Location not found. Try a different city name."); return; }
    localStorage.setItem(LS_LOC_KEY, JSON.stringify(result));
    setLocation(result);
    setLocationEdit(false);
    setCityInput("");
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const articlesWithImages = articles.filter((a) => a.image_url);
  const lead = articles[0];
  const featuredPool = articlesWithImages.filter((a) => a.article_id !== lead?.article_id);
  const featured = featuredPool.length >= 2 ? featuredPool.slice(0, 2) : articles.slice(1, 3);
  const usedIds = new Set([lead?.article_id, ...featured.map((a) => a.article_id)]);
  const wire = articles.filter((a) => !usedIds.has(a.article_id));
  const skyEvents = events.slice(0, 4);

  const topTopics = topics.slice(0, 6).map((t, i) => ({
    ...t,
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    trend: i < 2 ? "up" : i < 4 ? "flat" : "down",
  }));
  const totalReads = topTopics.reduce((s, t) => s + t.article_count, 0);

  // Donut arcs
  let cumulative = 0;
  const arcs = topTopics.map((t) => {
    const startAngle = totalReads > 0 ? (cumulative / totalReads) * 360 : 0;
    cumulative += t.article_count;
    const endAngle = totalReads > 0 ? (cumulative / totalReads) * 360 : 0;
    return { ...t, startAngle, endAngle };
  });

  const editionNum = String(Math.floor((Date.now() - new Date("2026-01-01").getTime()) / 86_400_000) + 1).padStart(4, "0");

  // Pull quote — rotates daily
  const dayOfYear = Math.floor((Date.now() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const quote = SPACE_QUOTES[dayOfYear % SPACE_QUOTES.length];

  // Wordle win rate
  const winRate = stats && stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const displayStreak = (() => {
    if (!stats || stats.currentStreak === 0) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const d = new Date(); d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    return stats.lastWonDate === today || stats.lastWonDate === yesterday ? stats.currentStreak : 0;
  })();

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <EditorialShell>
      {/* ── Section nav ── */}
      <nav className="section-nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={activeSection === s.id ? "active" : ""}
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ── Hero ── */}
      {lead ? (
        <section id="top" className="hero">
          {lead.image_url ? (
            <div className="hero-img">
              <img src={lead.image_url} alt={lead.title} />
            </div>
          ) : (
            <div className="hero-no-img" />
          )}
          <div className="hero-grain" />
          <div className="hero-content">
            <div className="hero-kicker">
              <span className="hero-sep" />
              Lead · {lead.news_site ?? "Space News"}
            </div>
            <h1 className="hero-headline">{lead.title}</h1>
            {lead.summary && <p className="hero-deck">{lead.summary}</p>}
            <div className="hero-meta">
              {lead.published_at && <span><strong>{formatTimeAgo(lead.published_at)}</strong></span>}
              {lead.news_site && <span>{lead.news_site}</span>}
              <button className="hero-read-more" onClick={() => navigate(`/articles/${lead.article_id}`)}>
                Read the brief →
              </button>
            </div>
          </div>
          {skyEvents[0] && (
            <aside className="hero-side">
              <div className="hero-side-label">Up Next · Tonight</div>
              <div className="hero-side-what">{skyEvents[0].name}</div>
              <div className="hero-side-when">
                {formatDate(skyEvents[0].date)}{skyEvents[0].time_hint ? ` · ${skyEvents[0].time_hint}` : ""}
              </div>
              {skyEvents[0].direction && (
                <div className="hero-side-compass">
                  <span>
                    Look <strong>{skyEvents[0].direction}</strong>
                    {skyEvents[0].altitude !== undefined ? ` · ${skyEvents[0].altitude}°` : ""}
                  </span>
                  <span className="hero-side-arrow">↗</span>
                </div>
              )}
            </aside>
          )}
        </section>
      ) : (
        <section id="top" className="hero">
          <div className="hero-no-img" />
          <div className="hero-content">
            <div className="hero-kicker"><span className="hero-sep" /> Loading today's edition…</div>
            <h1 className="hero-headline">Space news, curated daily.</h1>
          </div>
        </section>
      )}

      {/* ── Tonight's Sky ── */}
      <section id="sky" className="ed-section">
        <div className="ed-section-head">
          <div>
            <div className="ed-section-num">§ 01 · The View Tonight</div>
            <h2 className="ed-section-title">The sky tonight, <em>wherever you are</em>.</h2>
          </div>
          <div className="ed-section-meta">
            <span className="ed-section-pri">{location?.name ?? "Set location"}</span>
            <button className="ed-meta-link" onClick={() => { setLocationEdit((v) => !v); setCityInput(""); setGeoError(""); }}>
              {locationEdit ? "Cancel ↗" : "Change location ↗"}
            </button>
          </div>
        </div>

        {locationEdit && (
          <form className="ed-location-form" onSubmit={(e) => { void handleCitySubmit(e); }}>
            <input
              ref={cityInputRef}
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Enter city name (e.g. Brussels, New York…)"
              disabled={geoWorking}
            />
            <button type="submit" disabled={geoWorking || !cityInput.trim()}>
              {geoWorking ? "Searching…" : "Set"}
            </button>
            {geoError && <span className="ed-geo-error">{geoError}</span>}
          </form>
        )}

        {skyEvents.length > 0 ? (
          <div className="sky-strip">
            {skyEvents.map((ev, i) => (
              <div key={ev.id} className={`sky-card${i === 0 ? " featured" : ""}`}>
                <div className="sky-glyph">{GLYPH_MAP[ev.type] ?? "✦"}</div>
                <div className="sky-type">{TYPE_LABEL[ev.type] ?? ev.type}</div>
                <div className="sky-name">{ev.name}</div>
                <div className="sky-when">
                  {formatDate(ev.date)}{ev.time_hint ? `, ${ev.time_hint}` : ""}
                </div>
                <div className="sky-where">
                  {ev.direction ? (
                    <span>Look <strong>{ev.direction}</strong>{ev.altitude !== undefined ? ` · ${ev.altitude}°` : ""}</span>
                  ) : (
                    <span><strong>Global event</strong></span>
                  )}
                  <a
                    className="sky-cal-link"
                    href={buildCalendarUrl(ev)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    + Cal
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ed-empty">
            {location ? "No upcoming sky events found." : "Set your location to see tonight's events."}
          </p>
        )}
      </section>

      {/* ── Long Reads ── */}
      {featured.length > 0 && (
        <section id="long" className="ed-section">
          <div className="ed-section-head">
            <div>
              <div className="ed-section-num">§ 02 · Long Reads</div>
              <h2 className="ed-section-title">Two stories worth <em>slowing down</em> for.</h2>
            </div>
            <div className="ed-section-meta">
              <span className="ed-section-pri">Curated by freshness</span>
              <Link to="/browse" className="ed-meta-link">All articles ↗</Link>
            </div>
          </div>
          <div className="feature-grid">
            {featured.map((a, i) => (
              <div
                key={a.article_id}
                className={`feature${i === 1 ? " tall" : ""}`}
                onClick={() => navigate(`/articles/${a.article_id}`)}
              >
                {a.image_url ? (
                  <div className="feat-img">
                    <img src={a.image_url} alt="" loading="lazy" />
                  </div>
                ) : (
                  <div className="feat-img feat-img-placeholder">
                    <span>{a.news_site?.charAt(0).toUpperCase() ?? "S"}</span>
                  </div>
                )}
                <div className="feat-kicker">{a.freshness} · {a.news_site}</div>
                <h3 className="feat-head">{a.title}</h3>
                {a.summary && <p className="feat-deck">{a.summary}</p>}
                <div className="feat-meta">
                  {a.published_at && <span>{formatTimeAgo(a.published_at)}</span>}
                  <span className="feat-dot" />
                  <span className="feat-read">Read →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pull Quote ── */}
      <div className="pullquote">
        <div className="pq-mark">"</div>
        <blockquote className="pq-quote">{quote.text}</blockquote>
        <div className="pq-attr">{quote.attr}</div>
      </div>

      {/* ── The Wire ── */}
      <section id="wire" className="ed-section">
        <div className="ed-section-head">
          <div>
            <div className="ed-section-num">§ 03 · The Wire</div>
            <h2 className="ed-section-title">Everything else, <em>filed</em>.</h2>
          </div>
          <div className="ed-section-meta">
            <span className="ed-section-pri">{total} signals</span>
            <Link to="/browse" className="ed-meta-link">Browse &amp; filter ↗</Link>
          </div>
        </div>
        {wire.length > 0 ? (
          <div className="wire-grid">
            {wire.map((a) => (
              <div key={a.article_id} className="wire-item" onClick={() => navigate(`/articles/${a.article_id}`)}>
                {a.image_url ? (
                  <div className="wire-thumb">
                    <img src={a.image_url} alt="" loading="lazy" />
                  </div>
                ) : (
                  <div className="wire-thumb wire-placeholder">
                    {a.news_site?.charAt(0).toUpperCase() ?? "S"}
                  </div>
                )}
                <div className="wire-body">
                  <div className="wire-kicker">
                    <span className={`wire-topic ${a.freshness}`}>● {a.freshness}</span>
                    <span>{a.news_site}</span>
                  </div>
                  <div className="wire-head">{a.title}</div>
                  {a.summary && <div className="wire-deck">{a.summary}</div>}
                </div>
                {a.published_at && <div className="wire-time">{formatTimeAgo(a.published_at)}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="ed-empty">Loading signals…</p>
        )}
      </section>

      {/* ── Reading Orbit ── */}
      <section id="orbit" className="ed-section">
        <div className="ed-section-head">
          <div>
            <div className="ed-section-num">§ 04 · Reading Orbit</div>
            <h2 className="ed-section-title">The shape of <em>your</em> attention.</h2>
          </div>
          <div className="ed-section-meta">
            <span className="ed-section-pri">
              {totalReads > 0 ? `${totalReads} reads · ${topTopics.length} topics` : "No reads yet"}
            </span>
            <Link to="/reading-map" className="ed-meta-link">See full atlas ↗</Link>
          </div>
        </div>

        {topTopics.length > 0 ? (
          <div className="orbit-wrap">
            <div className="orbit-svg-wrap">
              <svg width="360" height="360" viewBox="0 0 360 360">
                <defs>
                  <radialGradient id="orbit-glow" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="rgba(232,84,44,0.18)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <circle cx={CX} cy={CY} r={170} fill="url(#orbit-glow)" />
                {arcs.map((a, i) => (
                  <path key={i} d={arcPath(a.startAngle, a.endAngle, R_OUTER, R_INNER)} fill={a.color} opacity="0.85">
                    <animate
                      attributeName="opacity"
                      values="0.85;1;0.85"
                      dur={`${4 + i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </path>
                ))}
                <circle cx={CX} cy={CY} r={R_INNER - 4} fill="#0a0a0f" />
                <text
                  x={CX} y={CY - 6}
                  fontFamily="Fraunces, serif" fontStyle="italic" fontWeight="500" fontSize="42"
                  fill="#f4ede0" textAnchor="middle"
                >
                  {totalReads}
                </text>
                <text
                  x={CX} y={CY + 22}
                  fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2"
                  fill="#8a8378" textAnchor="middle"
                >
                  READS
                </text>
              </svg>
            </div>
            <div className="orbit-side">
              {topTopics.map((t, i) => (
                <div key={i} className="orbit-row" onClick={() => navigate("/reading-map")}>
                  <div className="orbit-swatch" style={{ background: t.color }} />
                  <div className="orbit-name">{t.tag}</div>
                  <div className="orbit-count">{t.article_count} reads</div>
                  <div className={`orbit-trend ${t.trend}`}>
                    {t.trend === "up" ? "↑" : t.trend === "down" ? "↓" : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="orbit-empty">
            Read and explain articles to build your orbit.
          </p>
        )}
      </section>

      {/* ── Daily Cipher (Wordle) ── */}
      <section id="wordle" className="ed-section">
        <div className="ed-section-head">
          <div>
            <div className="ed-section-num">§ 05 · The Daily Cipher</div>
            <h2 className="ed-section-title">Five letters, six tries, a <em>universe</em> of vocabulary.</h2>
          </div>
          <div className="ed-section-meta">
            <span className="ed-section-pri">
              {stats ? `Puzzle #${editionNum} · ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Daily puzzle"}
            </span>
            <Link to="/wordle" className="ed-meta-link">Play now ↗</Link>
          </div>
        </div>
        <div className="wordle-promo">
          <div className="wp-copy">
            {stats ? (
              <>
                <h3>
                  {displayStreak > 0
                    ? <>Streak of <em>{displayStreak}</em>. Keep it going.</>
                    : stats.played > 0
                      ? <>You've played <em>{stats.played}</em> puzzles.</>
                      : <>Start today's <em>space</em> puzzle.</>
                  }
                </h3>
                <p>
                  {stats.played > 0
                    ? `${winRate}% win rate. Best streak: ${stats.maxStreak}.`
                    : "Guess the five-letter space word in six tries."
                  }
                </p>
                <div className="wp-stats">
                  <div><strong>{stats.played}</strong> Played</div>
                  <div><strong>{winRate}%</strong> Win rate</div>
                  <div><strong>{displayStreak}</strong> Streak</div>
                  <div><strong>{stats.maxStreak}</strong> Best</div>
                </div>
              </>
            ) : (
              <>
                <h3>Five letters. Six tries. A <em>universe</em> of vocabulary.</h3>
                <p>Guess the space-themed word of the day. New puzzle ships at midnight UTC.</p>
              </>
            )}
            <button className="wp-cta" onClick={() => navigate("/wordle")}>
              Play today's puzzle →
            </button>
          </div>
          <div className="wordle-board-mini">
            {Array.from({ length: 6 }).map((_, i) => {
              const row = miniBoard[i];
              return (
                <div key={i} className="wordle-row-mini">
                  {Array.from({ length: 5 }).map((_, j) => {
                    const letter = row?.letters[j] ?? "";
                    const state = row ? (row.states[j] ?? "absent") : "";
                    return (
                      <div key={j} className={`w-mini${letter ? ` ${state}` : ""}`}>
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </EditorialShell>
  );
}
