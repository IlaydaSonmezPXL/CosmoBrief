import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        <span className="nav-brand-icon" />
        Cosmo Brief
      </Link>
      <Link to="/reading-map" className="nav-link">Reading Map</Link>
      {user?.role === "admin" && <Link to="/admin" className="nav-link">Admin</Link>}
      <span className="nav-spacer" />
      <button className="nav-logout" onClick={handleLogout}>Sign out</button>
    </nav>
  );
}
