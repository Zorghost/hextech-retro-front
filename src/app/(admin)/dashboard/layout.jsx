import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");
  return <div>{children}</div>;
}
