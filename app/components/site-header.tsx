import { Link } from "react-router";

export function SiteHeader({ savedLocally }: { savedLocally: boolean }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <img
          className="brand-mark"
          src={`${import.meta.env.BASE_URL.replace(/\/?$/, "/")}logo.png`}
          alt=""
        />
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
