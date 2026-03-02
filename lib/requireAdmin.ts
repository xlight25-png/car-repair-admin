import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export function requireAdmin(nextPath: string) {
  const v = cookies().get("admin")?.value;
  if (v !== "1") {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }
}
