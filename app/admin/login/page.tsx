import LoginClient from "./LoginClient";

export const revalidate = 0;

type SP = { next?: string | string[] };

function pickFirst(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return null;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const next = pickFirst(sp?.next) ?? "/admin";

  return <LoginClient next={next} />;
}
