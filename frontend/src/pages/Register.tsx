import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { register } from "../api/auth";
import EarthIcon from "../components/EarthIcon";

export default function Register() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
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
          if (msg.includes("password")) setError("Password must be 6–128 characters.");
          else if (msg.includes("username")) setError("Username must be 3–50 characters.");
          else if (msg.includes("email")) setError("Enter a valid email address.");
          else setError("Invalid input — check your details.");
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <EarthIcon size={26} />
          <span className="auth-logo-text">Cosmo Brief</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start exploring the cosmos</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary">Create account</button>
        </form>
        <p style={{ marginTop: "1.25rem", fontSize: "0.85rem", color: "var(--text-sec)", textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
