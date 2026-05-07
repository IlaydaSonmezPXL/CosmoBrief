import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserMenu from "./UserMenu";

export default function EdNav() {
  const { user } = useAuth();
  const location = useLocation();

  function navClass(path: string) {
    return location.pathname === path ? "ed-nav-link active" : "ed-nav-link";
  }

  return (
    <nav className="ed-nav">
      <Link to="/" className="ed-nav-brand">
        Cosmo<span className="sep">·</span>Brief
      </Link>
      <div className="ed-nav-links">
        <Link to="/browse"       className={navClass("/browse")}>Browse</Link>
        <Link to="/reading-map"  className={navClass("/reading-map")}>Map</Link>
        <Link to="/wordle"       className={navClass("/wordle")}>Wordle</Link>
        {user?.role === "admin" && (
          <Link to="/admin" className={navClass("/admin")}>Admin</Link>
        )}
      </div>
      <span className="ed-nav-spacer" />
      <div className="ed-nav-right brand-user-wrap">
        <UserMenu />
      </div>
    </nav>
  );
}
