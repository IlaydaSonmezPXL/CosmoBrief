/* Browse — Editorial archive: index header + featured pick + dense wire-style list */
const { useState: useStateBrowse, useMemo: useMemoBrowse } = React;

const BROWSE_ARTICLES = [
  { id: 1, kicker: "fresh", topic: "JWST", site: "Nature Astronomy", time: "14m", read: 6, title: "JWST catches a cluster feeding the cosmic web.", deck: "First direct evidence the intracluster medium is leaking filaments into surrounding voids.", letter: "J", saved: true },
  { id: 2, kicker: "fresh", topic: "Starship", site: "SpaceNews", time: "1h", read: 4, title: "Starship Block 3 lights all 39 Raptors on McGregor stand.", deck: "A clean 6-second test on the new test bench in Texas paves the way for static fire next month.", letter: "S" },
  { id: 3, kicker: "fresh", topic: "Mars", site: "ESA Bulletin", time: "3h", read: 5, title: "Curiosity finds varved sediments at Gale Crater outer rim.", deck: "The thin layered deposits suggest seasonal lakes lasted millions of years longer than thought.", letter: "M" },
  { id: 4, kicker: "aging", topic: "Lunar", site: "Sky & Telescope", time: "9h", read: 3, title: "China publishes Chang'e‑6 farside basin sample-prep timeline.", deck: "First international dataset slated for release in early autumn under a new sharing protocol.", letter: "L" },
  { id: 5, kicker: "aging", topic: "Exoplanets", site: "Astronomy", time: "12h", read: 7, title: "TRAPPIST‑1 e atmosphere upper-bound tightens to 1% Earth surface pressure.", deck: "JWST NIRSpec transit stack rules out thick CO₂ envelopes — likely bare rock or thin volatile layer.", letter: "E" },
  { id: 6, kicker: "fresh", topic: "ISS", site: "NASA News", time: "16h", read: 2, title: "Crew‑10 reschedules undocking after Soyuz thruster anomaly.", deck: "Departure pushed 24 hours; no impact on next visiting vehicle window.", letter: "I" },
  { id: 7, kicker: "archived", topic: "JWST", site: "Quanta", time: "2d", read: 9, title: "Why the early universe looked so 'mature' to JWST.", deck: "A new accretion model reconciles galaxy mass functions at z>10 without invoking exotic physics.", letter: "J" },
  { id: 8, kicker: "archived", topic: "Mars", site: "Planetary Society", time: "3d", read: 4, title: "Perseverance caches its 24th sample tube at Three Forks depot.", deck: "Mars Sample Return architecture review concludes its 60-day public comment period this week.", letter: "M" },
  { id: 9, kicker: "fresh", topic: "Starship", site: "Eric Berger / Ars", time: "5h", read: 8, title: "Inside SpaceX's Starbase: the new tower-2 chopstick choreography.", deck: "Catch arms now retract 40% faster; commit-to-catch decisions moved 8 seconds earlier in flight.", letter: "S" },
  { id: 10, kicker: "aging", topic: "Lunar", site: "Spaceflight Now", time: "1d", read: 5, title: "Artemis III suit stress-tested in JSC dust chamber for 14-day cycle.", deck: "New cooling garment held within 0.4°C of nominal across simulated lunar mid-day.", letter: "L" },
];

const TOPIC_FACETS = [
  { name: "All", count: 247 },
  { name: "Starship", count: 38 },
  { name: "JWST", count: 41 },
  { name: "Mars", count: 32 },
  { name: "Lunar", count: 24 },
  { name: "Exoplanets", count: 19 },
  { name: "ISS", count: 14 },
  { name: "Cosmology", count: 22 },
  { name: "Solar", count: 12 },
];
const STATE_FACETS = ["all", "fresh", "aging", "archived", "saved"];
const SORTS = ["Most recent", "Most read", "Priority", "A → Z"];

function BrowsePage() {
  const [topic, setTopic] = useStateBrowse("All");
  const [state, setState] = useStateBrowse("all");
  const [sort, setSort] = useStateBrowse("Most recent");
  const [q, setQ] = useStateBrowse("");

  const filtered = useMemoBrowse(() => {
    return BROWSE_ARTICLES.filter(a => {
      if (topic !== "All" && a.topic !== topic) return false;
      if (state === "saved" && !a.saved) return false;
      if (state !== "all" && state !== "saved" && a.kicker !== state) return false;
      if (q && !(a.title + a.deck + a.topic).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [topic, state, sort, q]);

  return (
    <div className="cb-root browse-root" data-screen-label="Browse">
      <CBMasthead />
      <CBBrandBar
        left={["The Archive · 247 entries", "Filed by topic, date and editor"]}
        actions={<>
          <span className="cb-chip">Saved (12)</span>
          <span className="cb-chip">Reading map</span>
        </>}
      />
      <CBTabNav active="browse" onChange={() => {}} liveLabel="Indexed 4 minutes ago" />

      <header className="browse-head">
        <div className="browse-head-grid">
          <div>
            <div className="cb-section-num">§ The Archive</div>
            <h1 className="browse-title">Every signal we've filed, <em>indexed</em> by topic and edition.</h1>
            <p className="browse-deck">Skim the dense column below or narrow the field with topic, freshness and search. Saved briefs live under the bookmark filter.</p>
          </div>
          <div className="browse-head-stats">
            <div><strong>247</strong><span>total entries</span></div>
            <div><strong>127</strong><span>fresh · 48h</span></div>
            <div><strong>41</strong><span>JWST file</span></div>
            <div><strong>12</strong><span>saved by you</span></div>
          </div>
        </div>
      </header>

      <div className="browse-controls">
        <div className="browse-search">
          <span className="browse-search-label">Search the archive</span>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="title, deck, source…" />
          {q && <button className="browse-search-clear" onClick={() => setQ("")}>clear ×</button>}
        </div>
        <div className="browse-sort">
          <span className="browse-sort-label">Sort</span>
          <div className="browse-sort-opts">
            {SORTS.map(s => (
              <button key={s} className={sort === s ? "active" : ""} onClick={() => setSort(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="browse-facets">
        <div className="browse-facet-row">
          <span className="browse-facet-label">Topic</span>
          <div className="browse-facet-chips">
            {TOPIC_FACETS.map(t => (
              <button key={t.name} className={"browse-facet-chip " + (topic === t.name ? "active" : "")} onClick={() => setTopic(t.name)}>
                <span>{t.name}</span><span className="cnt">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="browse-facet-row">
          <span className="browse-facet-label">Status</span>
          <div className="browse-facet-chips">
            {STATE_FACETS.map(s => (
              <button key={s} className={"browse-facet-chip " + (state === s ? "active" : "")} onClick={() => setState(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <main className="browse-list-wrap">
        <div className="browse-list-meta">
          <span><strong>{filtered.length}</strong> {filtered.length === 1 ? "entry" : "entries"} {topic !== "All" && <span>· filed under <em>{topic}</em></span>}</span>
          <span>Page 1 of {Math.max(1, Math.ceil(filtered.length / 10))} · sorted by {sort.toLowerCase()}</span>
        </div>
        <ul className="browse-list">
          {filtered.map((a, i) => (
            <li key={a.id} className="browse-row">
              <div className="browse-row-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="browse-row-thumb cb-placeholder">{a.letter}</div>
              <div className="browse-row-body">
                <div className="browse-row-meta">
                  <span className={"browse-row-status " + a.kicker}>{a.kicker}</span>
                  <span>{a.topic}</span>
                  <span className="dot">·</span>
                  <span>{a.site}</span>
                  <span className="dot">·</span>
                  <span>{a.read} min read</span>
                </div>
                <h3 className="browse-row-title">{a.title}</h3>
                <p className="browse-row-deck">{a.deck}</p>
              </div>
              <div className="browse-row-aside">
                <div className="browse-row-time">{a.time}</div>
                <button className={"browse-row-save " + (a.saved ? "saved" : "")}>{a.saved ? "Saved" : "Save"}</button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="browse-empty">
              <div className="cb-kicker">No entries</div>
              <p>Nothing matched those filters in the archive. Try clearing the search or widening the topic.</p>
            </li>
          )}
        </ul>
        <div className="browse-pagination">
          <button className="cb-chip" style={{borderColor:"var(--rule)",color:"var(--paper-dim)"}}>← Newer</button>
          <span className="browse-pages">
            <strong>1</strong> · 2 · 3 · 4 · … · {Math.max(1, Math.ceil(filtered.length / 10))}
          </span>
          <button className="cb-chip" style={{borderColor:"var(--rule)",color:"var(--paper-dim)"}}>Older →</button>
        </div>
      </main>

      <CBFooter />
    </div>
  );
}

window.BrowsePage = BrowsePage;
