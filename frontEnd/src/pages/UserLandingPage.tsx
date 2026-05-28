import { useQuery } from "@tanstack/react-query";
import { departmentApi } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export function UserLandingPage() {
  const user = useAuthStore((state) => state.user);
  const departmentQuery = useQuery({
    queryKey: ["current-department"],
    queryFn: departmentApi.current,
    enabled: Boolean(user),
  });

  return (
    <div className="page">
      <div className="panel stack">
        <div className="topbar">
          <div>
            <p className="eyebrow">User home</p>
            <h1>Welcome, {user?.username}</h1>
            <p className="muted">Open the shared form link from your admin to submit a response.</p>
          </div>
        </div>

        <div className="grid cols-2">
          <div className="card stack">
            <strong>Account</strong>
            <p className="muted">Role: {user?.role}</p>
            <p className="muted">Email: {user?.email}</p>
          </div>
          <div className="card stack">
            <strong>Department</strong>
            {departmentQuery.isLoading ? <p className="muted">Loading department...</p> : null}
            {departmentQuery.data ? <p className="muted">{departmentQuery.data.department_Name}</p> : null}
            {departmentQuery.isError ? <p className="error">This account is not attached to a department yet.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
