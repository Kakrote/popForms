import { Link } from "react-router-dom";

export function ThankYouPage() {
  return (
    <div className="center-page">
      <div className="auth-card stack" style={{ textAlign: "center" }}>
        <p className="eyebrow">Submission complete</p>
        <h1>Thank you</h1>
        <p className="muted">Your response was received successfully.</p>
        <Link to="/" className="ghost-button" style={{ display: "inline-block", padding: "0.85rem 1rem", borderRadius: 12 }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
