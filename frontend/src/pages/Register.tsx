import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { register } from "../api/auth";
import EditorialShell from "../components/EditorialShell";

export default function Register() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await register(username, email, password);
      authLogin(data.access_token, data.user_id, data.role, data.username);
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const msg: string = err.response.data?.message ?? "";
        if (status === 409) {
          setError("Username or email already taken.");
        } else if (status === 422) {
          if (msg.includes("password"))      setError("Password must be 6–128 characters.");
          else if (msg.includes("username")) setError("Username must be 3–50 characters.");
          else if (msg.includes("email"))    setError("Enter a valid email address.");
          else                               setError("Invalid input — check your details.");
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        setError("Registration failed. Please try again.");
      }
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
              <div className="login-hero-title">Join the <em>nightly</em> edition.</div>
              <div className="login-hero-deck">
                Build your reading orbit, track constellations, and decode the daily cipher.
              </div>
              <div className="login-hero-meta">
                <span><strong>Curated</strong> archive</span>
                <span><strong>Member</strong> signals</span>
              </div>
            </div>
            <div className="login-hero-foot">
              <span>Open access</span>
              <span>Cancel anytime</span>
            </div>
          </aside>

          <div className="login-pane">
            <div className="login-pane-inner">
              <div className="cb-section-num">§ · New Subscription</div>
              <h1 className="login-title">Create your <em>account</em>.</h1>
              <p className="login-sub">
                Start your daily brief — free while we build the newsroom.
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
                  <label className="login-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
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
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" className="login-submit" disabled={loading}>
                  <span>{loading ? "Creating account…" : "Create account"}</span>
                  <span className="arr">→</span>
                </button>
              </form>

              <p className="login-footnote">
                Already subscribed? <Link to="/login">Sign in to your edition</Link>.
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
