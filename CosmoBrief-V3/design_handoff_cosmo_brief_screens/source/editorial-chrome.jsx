/* Shared editorial chrome: Masthead + BrandBar + TabNav + Footer */
const { useState, useEffect } = React;

function CBMasthead({ editionNo = "0117", weekday = "Tuesday", location = "Brussels · partial overcast · 11°C", subscribeLabel = "Subscribe" }) {
  const [now, setNow] = useState(new Date(2026, 4, 5));
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return (
    <div className="cb-masthead">
      <div className="left">
        <span>{weekday} Edition · No. {editionNo}</span>
        <span className="mute">{dateStr}</span>
      </div>
      <div className="right">
        <span className="cb-weather-pill">
          <span className="cb-weather-dot"></span> {location}
        </span>
        <span className="mute">{subscribeLabel}</span>
      </div>
    </div>
  );
}

function CBBrandBar({ left = ["2,419 archived signals", "127 fresh in last 48h"], actions, user = { initial: "A" }, size = "lg" }) {
  return (
    <div className="cb-brand-bar">
      <div className="cb-brand-meta">
        {left.map((line, i) => (
          <div className="row" key={i}>{line}</div>
        ))}
      </div>
      <div className="cb-brand" style={size === "sm" ? { fontSize: "3.4rem" } : null}>Cosmo<span className="amp">&</span>Brief</div>
      <div className="cb-brand-actions">
        {actions || (<>
          <span className="cb-chip">Search</span>
          <span className="cb-chip">Saved</span>
        </>)}
        <span className="cb-avatar">{user.initial}</span>
      </div>
    </div>
  );
}

function CBTabNav({ active, onChange, items, liveLabel = "Updated 14 minutes ago" }) {
  const tabs = items || [
    { id: "edition", label: "The Edition" },
    { id: "browse", label: "Browse" },
    { id: "map", label: "Reading Map" },
    { id: "wordle", label: "Daily Cipher" },
    { id: "admin", label: "Newsroom" },
  ];
  return (
    <nav className="cb-tabs">
      {tabs.map(t => (
        <button key={t.id} className={active === t.id ? "active" : ""} onClick={() => onChange && onChange(t.id)}>{t.label}</button>
      ))}
      <span className="spacer"></span>
      <span className="live"><span className="cb-live-dot"></span> {liveLabel}</span>
    </nav>
  );
}

function CBFooter() {
  return (
    <footer className="cb-footer">
      <div className="cb-footer-grid">
        <div>
          <div className="wm">Cosmo<span className="amp">&</span>Brief</div>
          <p className="tag">A daily personal edition of space news, charted by what you read.</p>
        </div>
        <div>
          <h4>Sections</h4>
          <ul>
            <li><a>The Edition</a></li>
            <li><a>Browse Archive</a></li>
            <li><a>Reading Map</a></li>
            <li><a>Daily Cipher</a></li>
          </ul>
        </div>
        <div>
          <h4>About</h4>
          <ul>
            <li><a>Masthead</a></li>
            <li><a>Sources</a></li>
            <li><a>Privacy</a></li>
            <li><a>Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Account</h4>
          <ul>
            <li><a>Profile</a></li>
            <li><a>Saved articles</a></li>
            <li><a>Notifications</a></li>
            <li><a>Sign out</a></li>
          </ul>
        </div>
        <div className="cb-footer-bottom">
          <span>© 2026 Cosmo&Brief · Independent publication</span>
          <span>Stardate 2026.125 · Edition 0117</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { CBMasthead, CBBrandBar, CBTabNav, CBFooter });
