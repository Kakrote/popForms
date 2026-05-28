import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="center-page">
      <div className="auth-card stack" style={{ textAlign: "center" }}>
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="muted">The page you requested does not exist.</p>
        <Link to="/" className="ghost-button" style={{ display: "inline-block", padding: "0.85rem 1rem", borderRadius: 12 }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
