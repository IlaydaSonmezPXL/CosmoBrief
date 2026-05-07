import { useState, useRef, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getMe, updateMe, wipeUserData, type UserMe } from "../api/users";

type View = "menu" | "settings" | "account";

// ── Menu main view ──────────────────────────────────────────────────────────

interface MenuViewProps {
  username: string;
  onSettings: () => void;
  onAccount: () => void;
  onLogout: () => void;
}

function MenuView({ username, onSettings, onAccount, onLogout }: MenuViewProps) {
  return (
    <>
      <div className="user-menu-head">
        <div className="user-menu-head-name">{username || "—"}</div>
        <div className="user-menu-head-sub">Cosmo Brief</div>
      </div>
      <div className="user-menu-body">
        <button className="user-menu-item" onClick={onSettings}>
          <span className="user-menu-item-icon">⚙</span>
          Settings
        </button>
        <button className="user-menu-item" onClick={onAccount}>
          <span className="user-menu-item-icon">◎</span>
          Account
        </button>
      </div>
      <div className="user-menu-footer">
        <button className="user-menu-item signout" onClick={onLogout}>
          <span className="user-menu-item-icon">→</span>
          Sign out
        </button>
      </div>
    </>
  );
}

// ── Settings panel ──────────────────────────────────────────────────────────

interface SettingsViewProps {
  onBack: () => void;
  userId: string;
}

function SettingsView({ onBack, userId }: SettingsViewProps) {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState("");

  async function handleWipe() {
    setWiping(true);
    setWipeError("");
    try {
      await wipeUserData();
      // Clear wordle data from localStorage for this user
      const today = new Date().toISOString().slice(0, 10);
      localStorage.removeItem(`wordle_${userId}_${today}`);
      setConfirmWipe(false);
      setWiping(false);
    } catch {
      setWipeError("Failed to reset data. Try again.");
      setWiping(false);
    }
  }

  return (
    <>
      <div className="user-panel-header">
        <button className="user-panel-back" onClick={onBack} title="Back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="user-panel-title">Settings</span>
      </div>
      <div className="user-panel-body">
        <div className="user-panel-section">
          <div className="user-panel-label">Data</div>
          {!confirmWipe ? (
            <>
              <p className="user-panel-danger-text">
                Wipes all reading history, AI explanations, topic map, and Wordle progress.
              </p>
              <button className="btn btn-sm btn-danger" onClick={() => setConfirmWipe(true)}>
                ↺ Reset all data
              </button>
            </>
          ) : (
            <>
              <p className="user-panel-danger-text">
                This cannot be undone. Continue?
              </p>
              <div className="user-panel-confirm">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleWipe}
                  disabled={wiping}
                >
                  {wiping ? "Resetting…" : "Confirm reset"}
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setConfirmWipe(false)}>
                  Cancel
                </button>
              </div>
              {wipeError && <p className="error-text" style={{ marginTop: "0.5rem" }}>{wipeError}</p>}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Account panel ───────────────────────────────────────────────────────────

interface AccountViewProps {
  onBack: () => void;
}

function AccountView({ onBack }: AccountViewProps) {
  const [me, setMe] = useState<UserMe | null>(null);
  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getMe().then(({ data }) => setMe(data)).catch(() => {});
  }, []);

  function handleCancel() {
    setChangingPw(false);
    setCurrentPw("");
    setNewPassword("");
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!currentPw || !newPassword) { setError("Both fields are required."); return; }
    setSaving(true);
    try {
      await updateMe({ current_password: currentPw, new_password: newPassword });
      setSuccess("Password updated.");
      handleCancel();
      setSuccess("Password updated.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to update. Try again.");
      }
    }
    setSaving(false);
  }

  const memberSince = me
    ? new Date(me.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <div className="user-panel-header">
        <button className="user-panel-back" onClick={onBack} title="Back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="user-panel-title">Account</span>
      </div>
      <div className="user-panel-body">
        <div className="user-panel-section">
          <div className="user-panel-meta-row">
            <span className="user-panel-meta-key">Username</span>
            <span className="user-panel-meta-val">{me?.username ?? "—"}</span>
          </div>
          <div className="user-panel-meta-row">
            <span className="user-panel-meta-key">Email</span>
            <span className="user-panel-meta-val">{me?.email ?? "—"}</span>
          </div>
          {memberSince && (
            <div className="user-panel-meta-row">
              <span className="user-panel-meta-key">Member since</span>
              <span className="user-panel-meta-val">{memberSince}</span>
            </div>
          )}
        </div>

        {!changingPw ? (
          <>
            {success && <p className="user-panel-success" style={{ marginBottom: "0.6rem" }}>{success}</p>}
            <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => setChangingPw(true)}>
              Change password
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              className="user-panel-input"
              type="password"
              placeholder="Current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
            />
            <input
              className="user-panel-input"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && <p className="error-text" style={{ marginBottom: "0.5rem" }}>{error}</p>}
            <div className="user-panel-confirm">
              <button type="submit" className="btn btn-sm btn-primary-sm" style={{ flex: 1 }} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// ── Root component ───────────────────────────────────────────────────────────

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView("menu");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); setView("menu"); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/login");
  }

  function toggle() {
    setOpen((o) => {
      if (o) setView("menu");
      return !o;
    });
  }

  const initial = (user?.username?.[0] ?? "?").toUpperCase();

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className={`user-menu-trigger${open ? " active" : ""}`} onClick={toggle}>
        <span className="user-avatar">{initial}</span>
        <span className="user-menu-name">{user?.username ?? ""}</span>
        <span className="user-menu-caret">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          {view === "menu" && (
            <MenuView
              username={user?.username ?? ""}
              onSettings={() => setView("settings")}
              onAccount={() => setView("account")}
              onLogout={handleLogout}
            />
          )}
          {view === "settings" && (
            <SettingsView onBack={() => setView("menu")} userId={user!.userId} />
          )}
          {view === "account" && (
            <AccountView onBack={() => setView("menu")} />
          )}
        </div>
      )}
    </div>
  );
}
