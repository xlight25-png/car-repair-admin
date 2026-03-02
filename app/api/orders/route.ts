import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  const sb = supabaseServer();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return err("BAD_JSON", "Body must be valid JSON", 400);
  }

  const v = body?.vehicle;
  if (!v) return err("BAD_REQUEST", "vehicle is required", 400);

  const make = String(v.make ?? "").trim();
  const model = String(v.model ?? "").trim();
  const year = String(v.year ?? "").trim();
  const license_plate = String(v.license_plate ?? "").trim().toUpperCase();

  if (!make || !model || !license_plate) {
    return err("BAD_REQUEST", "make, model, license_plate are required", 400);
  }
  if (!/^\d{4}$/.test(year)) {
    return err("BAD_REQUEST", "year must be YYYY", 400);
  }

  const vehicle = { make, model, year, license_plate };

  const { data, error } = await sb
    .from("orders")
    .insert({
      vehicle,
      // если в БД нет default на status_code — включи строку:
      // status_code: "RECEIVED",
    })
    .select("id, short_code")
    .single();

  if (error || !data) {
    return err("DB_INSERT_FAILED", error?.message ?? "Insert failed", 400);
  }

  // ✅ важно: возвращаем ПЛОСКОЙ объект
  return NextResponse.json({ id: data.id, short_code: data.short_code });
}
