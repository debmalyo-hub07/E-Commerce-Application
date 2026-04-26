import { redirect } from "next/navigation";

// Redirect /dashboard -> /admin/dashboard (correct URL)
export default function DashboardRedirect() {
  redirect("/admin/dashboard");
}
