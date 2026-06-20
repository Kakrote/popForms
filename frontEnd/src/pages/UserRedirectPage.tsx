import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { departmentApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { LogOut, FileQuestion } from "lucide-react";

export function UserRedirectPage() {
  const currentUser = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const departmentQuery = useQuery({
    queryKey: ["current-department"],
    queryFn: departmentApi.current,
    enabled: Boolean(currentUser),
  });

  const handleLogout = () => {
    clearSession();
  };

  if (departmentQuery.isLoading) {
    return (
      <div className="center-page">
        <div className="stack" style={{ alignItems: "center", gap: 16 }}>
          <div className="spinner" />
          <p className="muted" style={{ fontWeight: 500, letterSpacing: "0.02em" }}>
            Routing you to your questionnaire...
          </p>
        </div>
      </div>
    );
  }

  if (departmentQuery.isError || !departmentQuery.data) {
    return (
      <div className="center-page">
        <div 
          className="auth-card stack text-center" 
          style={{ 
            textAlign: "center", 
            background: "var(--surface)", 
            border: "1px solid var(--border)", 
            borderRadius: "24px", 
            padding: 40 
          }}
        >
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center", 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "var(--danger)", 
            width: 56,
            height: 56,
            borderRadius: 16, 
            margin: "0 auto 16px auto" 
          }}>
            <FileQuestion size={28} />
          </div>
          <h1>Department Setup Required</h1>
          <p className="muted small" style={{ marginBottom: 20 }}>
            You are not assigned to a department yet. Please contact your administrator to get assigned to a department to view your form.
          </p>
          <button 
            onClick={handleLogout} 
            className="ghost-button" 
            style={{ width: "100%", padding: "0.85rem" }}
          >
            <LogOut size={16} style={{ marginRight: 8 }} />
            Logout
          </button>
        </div>
      </div>
    );
  }

  const formAccessList = departmentQuery.data.formAccess ?? [];
  if (formAccessList.length > 0) {
    const firstForm = formAccessList[0].form;
    return <Navigate to={`/forms/${firstForm.slug}`} replace />;
  }

  // If no forms are assigned to the department, redirect to the dashboard
  return <Navigate to="/dashboard" replace />;
}
