import { Link } from "react-router";

export function SiteHeader() {
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
    </header>
  );
}
