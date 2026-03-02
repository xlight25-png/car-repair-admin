import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";

  // КРИТИЧНО: добавляем await для cookies()
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let query = supabase
    .from("orders")
    .select("id, short_code, status_code, vehicle, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (status && status !== "ALL") {
    query = query.eq("status_code", status);
  }

  if (q) {
    query = query.or(
      `short_code.ilike.%${q}%,vehicle->>license_plate.ilike.%${q}%,vehicle->>make.ilike.%${q}%,vehicle->>model.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data ?? [] });
}