import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  await requireAdmin();
  return <div>{children}</div>;
}
