import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
