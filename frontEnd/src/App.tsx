import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboardPage } from "./pages/admin/DashboardPage";
import { FormBuilderPage } from "./pages/admin/FormBuilderPage";
import { FormDetailPage } from "./pages/admin/FormDetailPage";
import { UserCreatePage } from "./pages/admin/UserCreatePage";
import { UserManagementPage } from "./pages/admin/UserManagementPage";
import { DepartmentManagementPage } from "./pages/admin/DepartmentManagementPage";
import { PublicFormPage } from "./pages/PublicFormPage";
import { ThankYouPage } from "./pages/ThankYouPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UserLandingPage } from "./pages/UserLandingPage";

function HomeRedirect() {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/app" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<ProtectedRoute />}> 
        <Route path="/app" element={<UserLandingPage />} />
        <Route path="/forms/:slug" element={<PublicFormPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="forms/new" element={<FormBuilderPage />} />
          <Route path="forms/:slug/edit" element={<FormBuilderPage />} />
          <Route path="forms/:slug" element={<FormDetailPage />} />
          <Route path="users/new" element={<UserCreatePage />} />
          <Route path="departments" element={<DepartmentManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
