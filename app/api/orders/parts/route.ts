import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  const sb = supabaseServer();

  const body = await req.json().catch(() => null);

  const orderId = Number(body?.orderId);
  const parts = String(body?.parts ?? "");

  if (!Number.isFinite(orderId)) {
    return err("BAD_REQUEST", "orderId must be a number");
  }

  // ограничение чтобы не улетало в мегатекст
  if (parts.length > 20000) {
    return err("TOO_LARGE", "Слишком длинное описание (макс 20000 символов)");
  }

  const { data, error } = await sb
    .from("orders")
    .update({ parts })
    .eq("id", orderId)
    .select("id, parts, updated_at")
    .single();

  if (error || !data) {
    return err("DB_UPDATE_FAILED", error?.message ?? "DB update failed", 500);
  }

  return NextResponse.json({ ok: true, order: data });
}
