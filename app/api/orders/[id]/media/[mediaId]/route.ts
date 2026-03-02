import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const { id, mediaId } = await params;

  const orderId = Number(id);
  const mId = Number(mediaId);

  if (!Number.isFinite(orderId)) return err("BAD_REQUEST", "invalid order id");
  if (!Number.isFinite(mId)) return err("BAD_REQUEST", "invalid media id");

  const sb = supabaseServer();

  // 1) Найти запись
  const { data: row, error: selErr } = await sb
    .from("order_media")
    .select("id, path, order_id")
    .eq("id", mId)
    .single();

  if (selErr || !row) return err("NOT_FOUND", "media not found", 404);
  if (row.order_id !== orderId) return err("FORBIDDEN", "media does not belong to order", 403);

  // 2) Удалить файл из storage
  const delStorage = await sb.storage.from("order-media").remove([row.path]);
  if (delStorage.error) return err("STORAGE_DELETE_FAILED", delStorage.error.message, 500);

  // 3) Удалить строку из БД
  const delDb = await sb.from("order_media").delete().eq("id", mId);
  if (delDb.error) return err("DB_DELETE_FAILED", delDb.error.message, 500);

  // 4) Touch updated_at чтобы клиент без F5 подтянул изменения
  await sb
    .from("orders")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return NextResponse.json({ ok: true });
}
