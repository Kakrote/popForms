import { Link } from "react-router-dom";
import { CheckCircle2, Home, LayoutDashboard } from "lucide-react";

export function ThankYouPage() {
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
          background: "var(--success-bg)",
          color: "var(--success)",
          margin: "0 auto 8px auto",
          border: "1px solid var(--success-border)"
        }}>
          <CheckCircle2 size={28} />
        </div>
        <p className="eyebrow" style={{ color: "var(--success)" }}>Submission Successful</p>
        <h1 style={{ margin: "4px 0 8px 0" }}>Response Recorded</h1>
        <p className="muted small">Thank you! Your questionnaire submission has been logged and locked successfully.</p>
        
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
          <Link 
            to="/dashboard" 
            id="thank-you-dashboard-btn"
            className="ghost-button" 
            style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "0.85rem 1rem", borderRadius: 12 }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
          <Link 
            to="/" 
            id="thank-you-home-btn"
            className="ghost-button" 
            style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "0.85rem 1rem", borderRadius: 12 }}
          >
            <Home size={14} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
