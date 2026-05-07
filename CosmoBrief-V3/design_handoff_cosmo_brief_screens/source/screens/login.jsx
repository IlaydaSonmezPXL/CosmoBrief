/* Login page — full-bleed editorial split layout */
const { useState: useStateLogin } = React;

function LoginPage() {
  const [mode, setMode] = useStateLogin("password"); // password | magic
  const [email, setEmail] = useStateLogin("");
  const [password, setPassword] = useStateLogin("");
  const [showPw, setShowPw] = useStateLogin(false);
  const [sent, setSent] = useStateLogin(false);

  return (
    <div className="cb-root login-root" data-screen-label="Login">
      <CBMasthead />
      <div className="cb-brand-bar">
        <div className="cb-brand-meta">
          <div className="row">A daily personal edition</div>
          <div className="row" style={{color:"var(--paper-mute)"}}>For subscribers only</div>
        </div>
        <div className="cb-brand">Cosmo<span className="amp">&</span>Brief</div>
        <div className="cb-brand-actions">
          <span className="cb-chip">Browse public archive</span>
        </div>
      </div>

      <main className="login-split">
        <aside className="login-hero">
          <div className="login-hero-img">
            <div className="cb-placeholder" style={{position:"absolute",inset:0}}>// hero · cosmic-web filaments</div>
          </div>
          <div className="login-hero-grad"></div>
          <div className="login-hero-content">
            <div className="cb-kicker">Tonight's lead · Cosmology</div>
            <h2 className="login-hero-title">JWST catches a cluster <em>feeding</em> the cosmic web.</h2>
            <p className="login-hero-deck">The intracluster medium is leaking filaments into surrounding voids — first direct evidence the web pulls itself together while it pulls galaxies in.</p>
            <div className="login-hero-meta">
              <span><strong>14 min ago</strong></span>
              <span>Nature Astronomy</span>
              <span>6 min read</span>
            </div>
          </div>
          <div className="login-hero-foot">
            <span>No. 0117 · Tuesday, May 5</span>
            <span>2,419 archived signals</span>
          </div>
        </aside>

        <section className="login-pane">
          <div className="login-pane-inner">
            <div className="cb-section-num" style={{marginBottom:"1.5rem"}}>§ Subscriber Entrance</div>
            <h1 className="login-title">Welcome back to <em>tonight's</em> edition.</h1>
            <p className="login-sub">Sign in to pick up where you left off — your reading map, saved briefs and the Daily Cipher streak are waiting.</p>

            <div className="login-mode">
              <button className={mode === "password" ? "active" : ""} onClick={() => { setMode("password"); setSent(false); }}>Password</button>
              <button className={mode === "magic" ? "active" : ""} onClick={() => { setMode("magic"); setSent(false); }}>Magic link</button>
            </div>

            {!sent && (
              <form className="login-form" onSubmit={(e) => { e.preventDefault(); if (mode === "magic") setSent(true); }}>
                <label className="login-field">
                  <span className="login-label">Email address</span>
                  <input type="email" placeholder="reader@cosmobrief.co" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                {mode === "password" && (
                  <label className="login-field">
                    <span className="login-label">
                      Password
                      <button type="button" className="login-show" onClick={() => setShowPw(s => !s)}>{showPw ? "Hide" : "Show"}</button>
                    </span>
                    <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <a className="login-forgot">Forgot password →</a>
                  </label>
                )}
                <button type="submit" className="login-submit">
                  {mode === "password" ? "Sign in to the edition" : "Email me a magic link"}
                  <span className="arr">→</span>
                </button>
              </form>
            )}

            {sent && (
              <div className="login-sent">
                <div className="cb-kicker">Dispatched · check your inbox</div>
                <p className="login-sent-msg">A signed link is on its way to <strong>{email || "your inbox"}</strong>. It expires in 15 minutes.</p>
                <button className="login-resend" onClick={() => setSent(false)}>← Use a different address</button>
              </div>
            )}

            <div className="login-divider"><span>Or by way of</span></div>
            <div className="login-oauth">
              <button className="login-oauth-btn">
                <span className="g">G</span>
                Continue with Google
              </button>
              <button className="login-oauth-btn">
                <span className="gh">◉</span>
                Continue with GitHub
              </button>
            </div>

            <p className="login-footnote">
              First time here? <a className="login-link">Begin a free subscription →</a>
            </p>
          </div>

          <div className="login-colophon">
            <span>Issued by Cosmo&Brief Press</span>
            <span>Stardate 2026.125</span>
          </div>
        </section>
      </main>
    </div>
  );
}

window.LoginPage = LoginPage;
