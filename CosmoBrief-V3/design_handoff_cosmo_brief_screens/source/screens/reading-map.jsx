/* Reading Map — constellation of topics with AI explanation pane */
const { useState: useStateMap } = React;

const MAP_TOPICS = [
  { id: "starship", name: "Starship", color: "#e8542c", count: 22, x: 22, y: 38, mag: 1, trend: "+8", subjects: ["Block 3 stack", "Tower-2 catch", "Raptor 4", "Stage-zero", "McGregor stand"] },
  { id: "jwst", name: "JWST", color: "#4ec5cf", count: 18, x: 65, y: 28, mag: 1, trend: "+2", subjects: ["Cosmic web filaments", "z>10 galaxies", "TRAPPIST atmospheres", "Ice giants"] },
  { id: "mars", name: "Mars", color: "#d4a64a", count: 14, x: 48, y: 60, mag: 2, trend: "+4", subjects: ["Gale Crater varves", "Sample Return", "Perseverance cache", "Methane plume"] },
  { id: "lunar", name: "Lunar", color: "#8a6dbf", count: 11, x: 80, y: 65, mag: 2, trend: "−1", subjects: ["Chang'e‑6", "Artemis III suit", "Farside basin"] },
  { id: "exo", name: "Exoplanets", color: "#7eb09b", count: 9, x: 30, y: 72, mag: 3, trend: "+1", subjects: ["TRAPPIST‑1e", "Hot Jupiters", "Biosignatures"] },
  { id: "iss", name: "ISS", color: "#c97b89", count: 7, x: 72, y: 48, mag: 3, trend: "0", subjects: ["Crew‑10 undock", "Soyuz anomaly", "Expedition 73"] },
];

const LINKS = [
  ["starship", "lunar"], ["starship", "mars"], ["jwst", "exo"], ["jwst", "mars"], ["mars", "lunar"], ["iss", "starship"], ["jwst", "iss"]
];

const AI_ESSAYS = {
  jwst: { title: "What you've been reading about JWST", words: 312, summary: "Across 18 briefs over 30 days you've gravitated toward two threads: the early-universe galaxy mass problem (six articles, mostly tied to the z>10 'too mature too fast' debate), and direct atmospheric spectroscopy of small worlds. Tonight's lead — filaments leaking from the intracluster medium — sits at the intersection of those interests.", points: ["You haven't yet opened anything on Saturn or the ice giants — JWST's planetary side is a blind spot.", "Your reading skews toward press release & Quanta long-form; you tend to skip ESA technical bulletins.", "The cosmic-web thread now connects to your Cosmology reads from last week — there's a crossover article queued."] },
  starship: { title: "What you've been reading about Starship", words: 287, summary: "22 briefs in 30 days makes Starship your most-read topic. The trend is upward: +8 vs the prior 30-day window. You read launch-vehicle hardware (Raptor, Block 3) far more than mission narratives.", points: ["Tower-2 catch choreography piece is a natural follow-up to your Block 3 reads.", "You've read every static-fire dispatch but skipped the FCC permit context."] },
  mars: { title: "What you've been reading about Mars", words: 210, summary: "Mars reading is climbing again — +4 month over month. Sample Return architecture and Curiosity geology dominate; Perseverance gets less attention.", points: ["Varved sediment story this morning aligns with three pieces you saved on Gale Crater stratigraphy.", "Mars Sample Return public comment closes Friday — worth tracking."] },
  lunar: { title: "What you've been reading about Lunar", words: 184, summary: "Slight cooling: 11 briefs, down 1. Artemis hardware over science. China's Chang'e‑6 sample timeline is the bridge into your March cluster on lunar geochemistry.", points: ["You haven't read anything on CLPS landers in 30 days.", "Try the Artemis III suit dust-cycle piece — connects to your Mars EVA reading."] },
  exo: { title: "What you've been reading about Exoplanets", words: 163, summary: "Exoplanets sits at 9 briefs, slowly trending up. TRAPPIST‑1 system dominates, biosignature methodology second.", points: ["Two unread tonight on hot-Jupiter atmospheric escape.", "Your interest pairs naturally with JWST atmospheric spectroscopy."] },
  iss: { title: "What you've been reading about the ISS", words: 138, summary: "Light reading: 7 briefs, flat. Crew operations over science payloads.", points: ["You skip almost all microgravity science — fair, but the protein crystallography piece this week was unusual."] },
};

function ReadingMapPage() {
  const [active, setActive] = useStateMap("jwst");
  const topic = MAP_TOPICS.find(t => t.id === active);
  const essay = AI_ESSAYS[active];

  return (
    <div className="cb-root map-root" data-screen-label="Reading Map">
      <CBMasthead />
      <CBBrandBar
        left={["Your reading map · 30 days", "81 reads · 6 topics charted"]}
        actions={<>
          <span className="cb-chip">Export</span>
          <span className="cb-chip">Compare 60 days</span>
        </>}
      />
      <CBTabNav active="map" onChange={() => {}} liveLabel="Re-charted 6 minutes ago" />

      <header className="map-head">
        <div>
          <div className="cb-section-num">§ Reading Map</div>
          <h1 className="map-title">A <em>constellation</em> of what you've actually read.</h1>
          <p className="map-deck">Each star is a topic; size and brightness scale with how many briefs you've opened. Lines connect topics you've read in the same session. Pick a star — the right column unfolds an AI-written reflection on what your reading suggests.</p>
        </div>
        <div className="map-head-stats">
          <div><strong>81</strong><span>reads · 30d</span></div>
          <div><strong>6</strong><span>topics charted</span></div>
          <div><strong>+14</strong><span>vs prior 30d</span></div>
          <div><strong>4.2</strong><span>avg / day</span></div>
        </div>
      </header>

      <main className="map-grid">
        <section className="map-canvas">
          <div className="map-canvas-meta">
            <span className="cb-kicker naked">Constellation · last 30 nights</span>
            <span className="map-canvas-coords">RA 12ʰ 30ᵐ · Dec +23°</span>
          </div>
          <svg viewBox="0 0 600 480" className="map-svg">
            <defs>
              <radialGradient id="map-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="rgba(232,84,44,0.18)" />
                <stop offset="100%" stopColor="rgba(232,84,44,0)" />
              </radialGradient>
              <pattern id="map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(244,237,224,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="600" height="480" fill="url(#map-grid)" />
            {/* concentric guides */}
            {[80, 160, 240].map((r, i) => (
              <circle key={i} cx="300" cy="240" r={r} fill="none" stroke="rgba(244,237,224,0.06)" strokeDasharray="2 6" />
            ))}
            <line x1="0" y1="240" x2="600" y2="240" stroke="rgba(244,237,224,0.06)" strokeDasharray="2 6" />
            <line x1="300" y1="0" x2="300" y2="480" stroke="rgba(244,237,224,0.06)" strokeDasharray="2 6" />
            {/* connecting lines */}
            {LINKS.map((pair, i) => {
              const a = MAP_TOPICS.find(t => t.id === pair[0]);
              const b = MAP_TOPICS.find(t => t.id === pair[1]);
              const isActive = active === pair[0] || active === pair[1];
              return (
                <line key={i}
                  x1={a.x * 6} y1={a.y * 4.8}
                  x2={b.x * 6} y2={b.y * 4.8}
                  stroke={isActive ? "rgba(232,84,44,0.5)" : "rgba(244,237,224,0.12)"}
                  strokeWidth="1"
                />
              );
            })}
            {/* stars */}
            {MAP_TOPICS.map(t => {
              const cx = t.x * 6, cy = t.y * 4.8;
              const baseR = 8 - t.mag * 1.5 + Math.sqrt(t.count);
              const isActive = active === t.id;
              return (
                <g key={t.id} className="map-star" onClick={() => setActive(t.id)} style={{cursor:"pointer"}}>
                  {isActive && <circle cx={cx} cy={cy} r={baseR + 28} fill="url(#map-glow)" />}
                  <circle cx={cx} cy={cy} r={baseR + 10} fill="none" stroke={t.color} strokeOpacity={isActive ? 0.6 : 0.18} strokeWidth="1" />
                  <circle cx={cx} cy={cy} r={baseR} fill={t.color} opacity={isActive ? 1 : 0.85}>
                    <animate attributeName="opacity" values={isActive ? "1;0.7;1" : "0.85;1;0.85"} dur={(4 + t.mag) + "s"} repeatCount="indefinite" />
                  </circle>
                  <text x={cx} y={cy - baseR - 12} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" letterSpacing="2" fill="rgba(244,237,224,0.45)">·{String(t.count).padStart(2,"0")}·</text>
                  <text x={cx} y={cy + baseR + 22} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize={isActive ? "20" : "16"} fontWeight="500" fill={isActive ? "var(--paper)" : "var(--paper-dim)"}>{t.name}</text>
                </g>
              );
            })}
          </svg>
          <div className="map-canvas-legend">
            <span><span className="dot" style={{background:"var(--accent)"}}></span> selected</span>
            <span><span className="dot small"></span> read count</span>
            <span><span className="line"></span> co-read in same session</span>
          </div>
        </section>

        <aside className="map-panel">
          <div className="map-panel-head">
            <div className="cb-section-num" style={{color: topic.color}}>
              <style>{`.map-panel-head .cb-section-num::before { background: ${topic.color}; }`}</style>
              § Topic file
            </div>
            <h2 className="map-panel-title">
              <span style={{color: topic.color}}>{topic.name}</span>
            </h2>
            <div className="map-panel-stats">
              <div><strong>{topic.count}</strong><span>reads · 30d</span></div>
              <div><strong style={{color: topic.trend.startsWith("+") ? "var(--accent)" : topic.trend.startsWith("−") ? "var(--gold)" : "var(--mute)"}}>{topic.trend}</strong><span>trend</span></div>
              <div><strong>{topic.subjects.length}</strong><span>threads</span></div>
            </div>
          </div>

          <div className="map-essay">
            <div className="cb-kicker">AI reflection · drafted 14:02</div>
            <h3 className="map-essay-title">{essay.title}</h3>
            <p className="map-essay-summary">{essay.summary}</p>
            <div className="map-essay-points">
              <h4>Worth noting</h4>
              <ul>
                {essay.points.map((p, i) => <li key={i}><span className="bullet">·</span>{p}</li>)}
              </ul>
            </div>
            <div className="map-essay-footer">
              <span>{essay.words} words · regenerated daily</span>
              <button className="map-regen">Re-draft →</button>
            </div>
          </div>

          <div className="map-threads">
            <h4>Threads in this file</h4>
            <ul>
              {topic.subjects.map((s, i) => (
                <li key={i}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="lbl">{s}</span>
                  <span className="cnt">{Math.max(1, Math.round(topic.count / topic.subjects.length))}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      <section className="map-strip">
        <div className="cb-kicker">All topics · pick to inspect</div>
        <div className="map-strip-rows">
          {MAP_TOPICS.map(t => (
            <button key={t.id} className={"map-strip-row " + (active === t.id ? "active" : "")} onClick={() => setActive(t.id)}>
              <span className="swatch" style={{background: t.color}}></span>
              <span className="name">{t.name}</span>
              <span className="bar"><span style={{width: (t.count / 22 * 100) + "%", background: t.color}}></span></span>
              <span className="count">{t.count}</span>
              <span className={"trend " + (t.trend.startsWith("+") ? "up" : t.trend.startsWith("−") ? "down" : "flat")}>{t.trend}</span>
            </button>
          ))}
        </div>
      </section>

      <CBFooter />
    </div>
  );
}

window.ReadingMapPage = ReadingMapPage;
