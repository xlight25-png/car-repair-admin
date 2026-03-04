import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: any }) {
  const p = await Promise.resolve(params);
  const raw = p?.short_code;
  const shortCode = String(raw ?? "").toUpperCase();

  const envCheck = {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    shortCode,
  };

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  let order: any = null;
  let err: any = null;

  if (shortCode) {
    const res = await sb
      .from("orders")
      .select("id, short_code, status_code")
      .eq("short_code", shortCode)
      .maybeSingle();

    order = res.data;
    err = res.error;
  }

  return (
    <pre>
      {JSON.stringify(
        {
          envCheck,
          error: err
            ? { message: err.message, code: err.code, details: err.details, hint: err.hint }
            : null,
          order,
        },
        null,
        2
      )}
    </pre>
  );
}