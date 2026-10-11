import { Link } from "react-router";

export function SiteHeader({ savedLocally }: { savedLocally: boolean }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          H
        </span>
        <span className="brand-name">
          Harvey <em>Games</em>
        </span>
      </Link>
      <p className="status-chip">
        <span className={savedLocally ? "status-dot is-live" : "status-dot"} />
        {savedLocally ? "Saved in this browser" : "Opening library"}
      </p>
    </header>
  );
}
