import { Link } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="center-page">
      <div 
        className="auth-card stack" 
        style={{ 
          textAlign: "center",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          borderRadius: "24px",
          padding: 40
        }}
      >
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "rgba(239, 68, 68, 0.1)",
          color: "var(--danger)",
          margin: "0 auto 8px auto"
        }}>
          <AlertCircle size={28} />
        </div>
        <p className="eyebrow" style={{ color: "var(--danger)" }}>Error 404</p>
        <h1 style={{ margin: "4px 0 8px 0" }}>Page Not Found</h1>
        <p className="muted small">The requested page URL could not be found or has been moved.</p>
        <Link 
          to="/" 
          id="notfound-home-btn"
          className="ghost-button" 
          style={{ display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "center", padding: "0.85rem 1rem", borderRadius: 12, marginTop: 12 }}
        >
          <Home size={16} />
          Go back Home
        </Link>
      </div>
    </div>
  );
}
