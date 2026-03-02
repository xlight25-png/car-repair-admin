import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ short_code: string }> }
) {
  const { short_code } = await params;

  const shortCode = String(short_code ?? "").trim().toUpperCase();
  if (!shortCode) return err("BAD_REQUEST", "short_code is required", 400);

  const sb = supabaseServer();

  // 1) Находим заказ по short_code (не раскрываем order_id клиенту)
  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select("id, short_code")
    .eq("short_code", shortCode)
    .single();

  if (orderErr || !order) {
    // не палим, существует ли заказ
    return err("NOT_FOUND", "order not found", 404);
  }

  // 2) Берём медиа по order_id
  const { data: rows, error: mediaErr } = await sb
    .from("order_media")
    .select("id, path, mime, size, kind, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });

  if (mediaErr) return err("DB_SELECT_FAILED", mediaErr.message, 500);

  // 3) Private bucket -> делаем signed urls
  const items = await Promise.all(
    (rows ?? []).map(async (m: any) => {
      const signed = await sb.storage
        .from("order-media")
        .createSignedUrl(m.path, 60 * 10);

      return {
        id: m.id,
        kind: m.kind,
        mime: m.mime,
        created_at: m.created_at,
        url: signed.data?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ items });
}
