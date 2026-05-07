/* Admin — The Newsroom: editor's desk for users, tokens, content */
const { useState: useStateAdmin } = React;

const ADMIN_USERS = [
  { id: 1, name: "Iris Andersson", email: "iris@cosmobrief.co", role: "editor", status: "active", joined: "Mar 12, 2025", last: "14m", reads: 412, tokens: 28430, plan: "annual", initial: "I" },
  { id: 2, name: "Hanno Vermeer", email: "hanno@cosmobrief.co", role: "subscriber", status: "active", joined: "Apr 02, 2025", last: "1h", reads: 287, tokens: 19120, plan: "monthly", initial: "H" },
  { id: 3, name: "Yuna Park", email: "yuna.p@cosmobrief.co", role: "subscriber", status: "active", joined: "Jan 28, 2026", last: "3h", reads: 168, tokens: 14002, plan: "annual", initial: "Y" },
  { id: 4, name: "Marcus Albrecht", email: "marcus@cosmobrief.co", role: "subscriber", status: "trial", joined: "Apr 24, 2026", last: "2d", reads: 14, tokens: 980, plan: "trial", initial: "M" },
  { id: 5, name: "Linnea Frost", email: "linnea@cosmobrief.co", role: "subscriber", status: "lapsed", joined: "Sep 15, 2024", last: "31d", reads: 642, tokens: 41208, plan: "expired", initial: "L" },
  { id: 6, name: "Ravi Ghosh", email: "ravi@cosmobrief.co", role: "admin", status: "active", joined: "Aug 04, 2024", last: "5m", reads: 1208, tokens: 88401, plan: "staff", initial: "R" },
  { id: 7, name: "Sofia Bellini", email: "sofia.b@cosmobrief.co", role: "subscriber", status: "active", joined: "Feb 11, 2026", last: "12h", reads: 92, tokens: 7211, plan: "monthly", initial: "S" },
];

const QUEUE = [
  { topic: "Starship", title: "Starship Block 3 lights all 39 Raptors on McGregor stand.", status: "ready", priority: "high", source: "SpaceNews" },
  { topic: "Cosmology", title: "JWST catches a cluster feeding the cosmic web.", status: "live", priority: "lead", source: "Nature Astronomy" },
  { topic: "Mars", title: "Curiosity finds varved sediments at Gale Crater outer rim.", status: "ready", priority: "med", source: "ESA Bulletin" },
  { topic: "Lunar", title: "Chang'e‑6 farside basin sample-prep timeline released.", status: "draft", priority: "med", source: "Sky & Telescope" },
  { topic: "Exoplanets", title: "TRAPPIST‑1 e atmosphere upper-bound tightens.", status: "review", priority: "low", source: "Astronomy" },
];

function AdminPage() {
  const [pane, setPane] = useStateAdmin("desk");
  const [filter, setFilter] = useStateAdmin("all");

  const filteredUsers = ADMIN_USERS.filter(u => filter === "all" ? true : u.status === filter);

  return (
    <div className="cb-root admin-root" data-screen-label="Admin">
      <div className="cb-masthead">
        <div className="left">
          <span>Newsroom · Editor's Desk</span>
          <span className="mute">Internal · Tuesday, May 5, 2026</span>
        </div>
        <div className="right">
          <span className="cb-weather-pill">
            <span className="cb-weather-dot"></span> All systems · 99.94% uptime
          </span>
          <span className="mute">Logout</span>
        </div>
      </div>
      <CBBrandBar
        left={["The Newsroom · staff entrance", "7 active staff · 2,419 archived"]}
        actions={<>
          <span className="cb-chip">Public site →</span>
          <span className="cb-chip coral">+ New brief</span>
        </>}
        user={{ initial: "R" }}
      />
      <nav className="cb-tabs admin-tabs">
        {[
          { id: "desk", label: "Desk" },
          { id: "users", label: "Subscribers" },
          { id: "tokens", label: "Token usage" },
          { id: "queue", label: "Article queue" },
          { id: "feeds", label: "Feeds" },
          { id: "settings", label: "Settings" },
        ].map(t => (
          <button key={t.id} className={pane === t.id ? "active" : ""} onClick={() => setPane(t.id)}>{t.label}</button>
        ))}
        <span className="spacer"></span>
        <span className="live"><span className="cb-live-dot"></span> Synced 2m ago</span>
      </nav>

      <header className="admin-head">
        <div>
          <div className="cb-section-num">§ Editor's Desk</div>
          <h1 className="admin-title">Today's <em>edition</em>, behind the masthead.</h1>
          <p className="admin-deck">Track subscriber health, monitor AI token spend, shepherd the article queue and tune the feeds. The newsroom runs lean — six dials and a clear conscience.</p>
        </div>
        <div className="admin-head-stats">
          <div className="stat">
            <span className="lbl">Active subs</span>
            <strong>1,247</strong>
            <span className="trend up">+24 this week</span>
          </div>
          <div className="stat">
            <span className="lbl">AI tokens · MTD</span>
            <strong>2.41M</strong>
            <span className="trend">68% of budget</span>
          </div>
          <div className="stat">
            <span className="lbl">Articles queued</span>
            <strong>14</strong>
            <span className="trend">3 lead-eligible</span>
          </div>
          <div className="stat">
            <span className="lbl">Feed health</span>
            <strong>5/5</strong>
            <span className="trend up">all green</span>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-col admin-tokens">
          <div className="admin-col-head">
            <div>
              <div className="cb-section-num">§ 01 · Token usage</div>
              <h2 className="admin-col-title">AI token spend, <em>this month</em></h2>
            </div>
            <div className="admin-col-meta">
              <span className="pri">Budget · 3.5M tokens</span>
              <span>Resets May 31 · 25 days left</span>
            </div>
          </div>

          <div className="admin-meter">
            <div className="admin-meter-bar">
              <span className="seg seg-explanations" style={{width: "42%"}}><em>1.01M</em></span>
              <span className="seg seg-summaries" style={{width: "16%"}}><em>388k</em></span>
              <span className="seg seg-cipher" style={{width: "6%"}}><em>148k</em></span>
              <span className="seg seg-emails" style={{width: "4%"}}><em>96k</em></span>
            </div>
            <div className="admin-meter-legend">
              <span><span className="sw" style={{background:"var(--accent)"}}></span> Reading-map explanations · 1.01M</span>
              <span><span className="sw" style={{background:"var(--gold)"}}></span> Article summaries · 388k</span>
              <span><span className="sw" style={{background:"var(--cyan)"}}></span> Cipher hint · 148k</span>
              <span><span className="sw" style={{background:"var(--plum)"}}></span> Digest emails · 96k</span>
              <span><span className="sw" style={{background:"var(--rule)"}}></span> Remaining · 1.09M</span>
            </div>
          </div>

          <table className="admin-table tokens-table">
            <thead>
              <tr><th>Surface</th><th>Model</th><th className="num">Calls · 30d</th><th className="num">Avg tokens</th><th className="num">Spend</th><th>Trend</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Reading-map essay</strong></td><td>claude-sonnet</td><td className="num">3,241</td><td className="num">312</td><td className="num">$48.20</td><td><span className="trend up">+18%</span></td></tr>
              <tr><td><strong>Article summary</strong></td><td>claude-haiku</td><td className="num">8,902</td><td className="num">44</td><td className="num">$12.10</td><td><span className="trend up">+4%</span></td></tr>
              <tr><td><strong>Cipher soft hint</strong></td><td>claude-haiku</td><td className="num">412</td><td className="num">360</td><td className="num">$3.80</td><td><span className="trend flat">flat</span></td></tr>
              <tr><td><strong>Digest email</strong></td><td>claude-haiku</td><td className="num">1,247</td><td className="num">78</td><td className="num">$2.40</td><td><span className="trend down">−6%</span></td></tr>
            </tbody>
          </table>
        </section>

        <section className="admin-col admin-users">
          <div className="admin-col-head">
            <div>
              <div className="cb-section-num">§ 02 · Subscribers</div>
              <h2 className="admin-col-title">Follow up <em>seven</em> readers worth a note.</h2>
            </div>
            <div className="admin-col-meta">
              <span className="pri">1,247 active · 38 trial · 42 lapsed</span>
              <span>Click a row to draft a follow-up</span>
            </div>
          </div>

          <div className="admin-user-filters">
            {["all", "active", "trial", "lapsed"].map(f => (
              <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f}</button>
            ))}
            <span className="spacer"></span>
            <span className="admin-search">
              <span className="lbl">Find</span>
              <input placeholder="email or name" />
            </span>
          </div>

          <table className="admin-table users-table">
            <thead>
              <tr><th></th><th>Reader</th><th>Plan</th><th className="num">Reads</th><th className="num">Tokens</th><th>Last seen</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className={u.status === "lapsed" ? "warn" : ""}>
                  <td><span className="admin-avatar">{u.initial}</span></td>
                  <td>
                    <strong>{u.name}</strong>
                    <span className="email">{u.email}</span>
                  </td>
                  <td><span className={"admin-plan " + u.plan}>{u.plan}</span></td>
                  <td className="num">{u.reads}</td>
                  <td className="num">{u.tokens.toLocaleString()}</td>
                  <td className="last">{u.last} ago</td>
                  <td><span className={"admin-status " + u.status}>{u.status}</span></td>
                  <td><button className="admin-row-action">{u.status === "lapsed" ? "Re-engage →" : "Note →"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-col admin-queue">
          <div className="admin-col-head">
            <div>
              <div className="cb-section-num">§ 03 · Article queue</div>
              <h2 className="admin-col-title">Briefs waiting to <em>go to press</em>.</h2>
            </div>
            <div className="admin-col-meta">
              <span className="pri">14 in flight · 1 lead</span>
              <span>Auto-publish window opens 23:30 UTC</span>
            </div>
          </div>

          <ul className="admin-queue-list">
            {QUEUE.map((q, i) => (
              <li key={i} className={"admin-queue-item " + q.priority}>
                <span className="qnum">{String(i + 1).padStart(2, "0")}</span>
                <div className="qbody">
                  <div className="qmeta">
                    <span className={"qstatus " + q.status}>{q.status}</span>
                    <span>{q.topic}</span>
                    <span className="dot">·</span>
                    <span>{q.source}</span>
                  </div>
                  <h3 className="qtitle">{q.title}</h3>
                </div>
                <span className={"qprio " + q.priority}>{q.priority}</span>
                <button className="qaction">Open →</button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <CBFooter />
    </div>
  );
}

window.AdminPage = AdminPage;
