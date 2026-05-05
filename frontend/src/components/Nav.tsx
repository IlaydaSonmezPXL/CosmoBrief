import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EarthIcon from "./EarthIcon";
import UserMenu from "./UserMenu";

export default function Nav() {
  const { user } = useAuth();
  const location = useLocation();

  function navClass(path: string) {
    return location.pathname === path ? "nav-link active" : "nav-link";
  }

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        <EarthIcon size={20} />
        Cosmo Brief
      </Link>
      <Link to="/reading-map" className={navClass("/reading-map")}>Reading Map</Link>
      <Link to="/wordle" className={navClass("/wordle")}>Wordle</Link>
      {user?.role === "admin" && <Link to="/admin" className={navClass("/admin")}>Admin</Link>}
      <span className="nav-spacer" />
      <UserMenu />
    </nav>
  );
}
