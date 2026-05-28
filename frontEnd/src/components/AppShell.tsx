import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">PopForms</p>
          <h1>Admin dashboard</h1>
          <p className="muted">Create forms, track responses, and manage status from one place.</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/forms/new">New form</NavLink>
          <NavLink to="/admin/users/new">New user</NavLink>
          <NavLink to="/admin/users">Manage users</NavLink>
        </nav>

        <div className="sidebar-footer">
          <div>
            <p className="muted">Signed in as</p>
            <strong>{user?.username ?? "Admin"}</strong>
          </div>
          <button className="ghost-button" type="button" onClick={clearSession}>
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
