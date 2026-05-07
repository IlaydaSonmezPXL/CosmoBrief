import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/auth";
import EditorialShell from "../components/EditorialShell";

export default function Login() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await login(username, password);
      authLogin(data.access_token, data.user_id, data.role, data.username);
      navigate("/");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <EditorialShell>
      <div className="login-root">
        <div className="login-split">
          <aside className="login-hero">
            <div className="login-hero-bg" />
            <div className="login-hero-grad" />
            <div className="login-hero-header">
              <div className="login-hero-wordmark">Cosmo<span className="sep">·</span>Brief</div>
            </div>
            <div className="login-hero-content">
              <div className="login-hero-title">The nightly <em>edition</em> for spacefaring readers.</div>
              <div className="login-hero-deck">
                Launches, discoveries, and cosmic signals — curated into a daily brief.
              </div>
              <div className="login-hero-meta">
                <span><strong>15 min</strong> read</span>
                <span><strong>24/7</strong> signals</span>
              </div>
            </div>
            <div className="login-hero-foot">
              <span>Issued daily</span>
              <span>Since 2026</span>
            </div>
          </aside>

          <div className="login-pane">
            <div className="login-pane-inner">
              <div className="cb-section-num">§ · Subscriber Entrance</div>
              <h1 className="login-title">Sign in to your <em>edition</em>.</h1>
              <p className="login-sub">
                Your archive, reading map, and daily cipher are waiting.
              </p>

              <form className="login-form" onSubmit={(e) => { void handleSubmit(e); }}>
                <div className="login-field">
                  <label className="login-label" htmlFor="username">Username</label>
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="login-field">
                  <label className="login-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" className="login-submit" disabled={loading}>
                  <span>{loading ? "Signing in…" : "Sign in"}</span>
                  <span className="arr">→</span>
                </button>
              </form>

              <p className="login-footnote">
                No account yet? <Link to="/register">Begin a free subscription</Link>.
              </p>
            </div>

            <div className="login-colophon">
              <span>Cosmo Brief</span>
              <span>Member access</span>
            </div>
          </div>
        </div>
      </div>
    </EditorialShell>
  );
}
