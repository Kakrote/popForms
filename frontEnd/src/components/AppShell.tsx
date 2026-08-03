import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { 
  LayoutDashboard, 
  BarChart3,
  PlusCircle, 
  UserPlus, 
  Building2, 
  Users, 
  LogOut,
  FileText
} from "lucide-react";
import universityLogo from "../public/university.png";
import logo from "../public/logo.png";

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-start" }}>
            <img 
              src={universityLogo} 
              alt="Uttaranchal University Logo" 
              style={{ maxWidth: "100%", maxHeight: "36px", objectFit: "contain" }} 
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              background: "#fff",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow)",
              overflow: "hidden"
            }}>
              <img src={logo} alt="PRAGATI Icon" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p className="eyebrow" style={{ margin: 0, fontWeight: 700, fontFamily: "'Oswald', sans-serif", fontSize: "1.05rem", letterSpacing: "0.03em" }}>PRAGATI Admin</p>
              <p className="muted" style={{ fontSize: "0.65rem", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>From Data to Decisions</p>
            </div>
          </div>
          <h1 style={{ marginTop: 8 }}>Admin Portal</h1>
          <p className="muted small">Create forms, track responses, and manage status from one place.</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end id="nav-dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/admin/analytics" id="nav-analytics">
            <BarChart3 size={18} />
            Analytics Engine
          </NavLink>
          <NavLink to="/admin/forms/new" id="nav-new-form">
            <PlusCircle size={18} />
            New form
          </NavLink>
          <NavLink to="/admin/users/new" id="nav-new-user">
            <UserPlus size={18} />
            New user
          </NavLink>
          <NavLink to="/admin/departments" id="nav-departments">
            <Building2 size={18} />
            Departments
          </NavLink>
          <NavLink to="/admin/users" id="nav-manage-users">
            <Users size={18} />
            Manage users
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div>
            <p className="muted small" style={{ marginBottom: 4 }}>Signed in as</p>
            <strong style={{ color: "var(--text)" }}>{user?.username ?? "Admin"}</strong>
          </div>
          <button className="ghost-button" type="button" onClick={handleLogout} id="btn-logout" style={{ width: "100%" }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-panel" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        <footer style={{ 
          textAlign: "center", 
          padding: "20px 0 10px 0", 
          marginTop: "40px",
          borderTop: "1px solid var(--border)",
          fontSize: "0.8rem",
          color: "var(--text)",
          opacity: 0.6
        }}>
          &copy; Developed by IQAC, Uttaranchal University
        </footer>
      </main>
    </div>
  );
}
