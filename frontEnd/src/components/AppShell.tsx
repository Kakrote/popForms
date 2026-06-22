import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { 
  LayoutDashboard, 
  PlusCircle, 
  UserPlus, 
  Building2, 
  Users, 
  LogOut,
  FileText
} from "lucide-react";
import universityLogo from "../public/university.png";

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
              background: "var(--accent-gradient)",
              borderRadius: "8px",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-glowing)"
            }}>
              <FileText size={14} color="#fff" />
            </div>
            <p className="eyebrow" style={{ margin: 0 }}>PopForms Admin</p>
          </div>
          <h1 style={{ marginTop: 8 }}>Admin Portal</h1>
          <p className="muted small">Create forms, track responses, and manage status from one place.</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end id="nav-dashboard">
            <LayoutDashboard size={18} />
            Dashboard
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

      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}
