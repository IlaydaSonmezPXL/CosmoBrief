import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listArticles } from "../api/articles";
import UserMenu from "./UserMenu";

const EPOCH = new Date("2026-01-01T00:00:00Z").getTime();

const TABS = [
  { to: "/", label: "Edition", end: true },
  { to: "/browse", label: "Browse" },
  { to: "/reading-map", label: "Reading Map" },
  { to: "/wordle", label: "Daily Cipher" },
  { to: "/admin", label: "Admin", adminOnly: true },
];

interface ShellSections {
  items: Array<{ id: string; label: string }>;
  active: string;
  onSelect: (id: string) => void;
}

interface EditorialShellProps {
  children: React.ReactNode;
  // When set, the Edition tab is replaced by these in-page section links.
  sections?: ShellSections;
}

export default function EditorialShell({ children, sections }: EditorialShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState({ total: 0, fresh: 0 });
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("cosmo_location");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { name?: string };
      if (parsed?.name) setLocationName(parsed.name);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listArticles({ limit: 20 })
      .then(({ data }) => {
        if (!active) return;
        const fresh = data.articles.filter((a) => a.freshness === "fresh").length;
        setStats({ total: data.total, fresh });
        setLastUpdated(new Date());
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user]);

  const editionNum = useMemo(() => {
    const dayIndex = Math.floor((now.getTime() - EPOCH) / 86_400_000);
    return String(dayIndex + 1).padStart(4, "0");
  }, [now]);

  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  // `now` ticks once a minute, so it can lag behind lastUpdated; clamp to avoid "-1m ago".
  const minutesAgo = lastUpdated ? Math.max(0, Math.floor((now.getTime() - lastUpdated.getTime()) / 60_000)) : null;
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const stardate = `${now.getFullYear()}.${String(dayOfYear).padStart(3, "0")}`;
  const utcTime = now.toUTCString().slice(17, 22) + " UTC";

  const liveLabel = user
    ? minutesAgo === null
      ? "Loading…"
      : minutesAgo === 0
        ? "Just updated"
        : `Updated ${minutesAgo}m ago`
    : "Sign in for live updates";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="cb-root editorial">
      <div className="cb-masthead">
        <div className="left">
          <span>{dayName} Edition · No. {editionNum}</span>
          <span className="mute">{dateStr}</span>
        </div>
        <div className="right">
          {locationName && (
            <span className="cb-weather-pill">
              <span className="cb-weather-dot" />
              {locationName}
            </span>
          )}
          {user ? (
            <Link to="/browse" className="mute">Browse all →</Link>
          ) : (
            <Link to="/login" className="mute">Sign in →</Link>
          )}
        </div>
      </div>

      <div className="cb-brand-bar">
        <div className="cb-brand-meta">
          <div className="row"><strong>{user ? stats.total : "—"}</strong> archived signals</div>
          <div className="row">{user ? `${stats.fresh} fresh in last 48h` : "Sign in to see your edition"}</div>
        </div>
        <div className="cb-brand">Cosmo<span className="sep">·</span>Brief</div>
        <div className="cb-brand-actions">
          {user ? (
            <div className="brand-user-wrap">
              <UserMenu />
            </div>
          ) : (
            <>
              <Link to="/login" className="cb-chip coral">Sign in</Link>
              <Link to="/register" className="cb-chip">Register</Link>
            </>
          )}
        </div>
      </div>

      {user && (
        <nav className="cb-tabs">
          {TABS.filter((t) => !t.adminOnly || user.role === "admin").map(({ to, label, end }) =>
            sections && to === "/" ? (
              <Fragment key={to}>
                {sections.items.map((s) => (
                  <button
                    key={s.id}
                    className={sections.active === s.id ? "active" : ""}
                    onClick={() => sections.onSelect(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
                <span className="divider" />
              </Fragment>
            ) : (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
                {label}
              </NavLink>
            )
          )}
          <span className="spacer" />
          <span className="live">
            <span className="cb-live-dot" />
            {liveLabel}
          </span>
        </nav>
      )}

      {children}

      <footer className="cb-footer">
        <div className="cb-footer-grid">
          <div>
            <div className="wm">Cosmo<span className="sep">·</span>Brief</div>
            <div className="tag">A daily edition for people who still look up.</div>
          </div>
          <div>
            <h4>Sections</h4>
            <ul>
              <li><Link to="/browse">Browse articles</Link></li>
              <li><Link to="/reading-map">Reading map</Link></li>
              <li><Link to="/wordle">Daily cipher</Link></li>
              {user?.role === "admin" && <li><Link to="/admin">Newsroom</Link></li>}
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              {user ? (
                <>
                  <li><Link to="/browse">Your edition</Link></li>
                  <li><button onClick={handleLogout}>Sign out</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Sign in</Link></li>
                  <li><Link to="/register">Create account</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4>Sources</h4>
            <ul>
              <li><a href="https://spaceflightnewsapi.net" target="_blank" rel="noopener noreferrer">SNAPI</a></li>
              <li><a href="https://astronomyapi.com" target="_blank" rel="noopener noreferrer">AstronomyAPI</a></li>
              <li><a href="https://nominatim.openstreetmap.org" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></li>
            </ul>
          </div>
          <div className="cb-footer-bottom">
            <span>© {now.getFullYear()} Cosmo Brief · A personal edition</span>
            <span>Stardate {stardate} · Compiled at {utcTime}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
