import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function kindFromMime(mime: string) {
  return mime.startsWith("video/") ? "video" : "image";
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB (под видео норм)

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) return err("BAD_REQUEST", "invalid order id");

  const sb = supabaseServer();
  const form = await req.formData();
  const files = form.getAll("files");

  if (!files.length) return err("BAD_REQUEST", "files is required (FormData)");

  const uploaded: any[] = [];

  for (const f of files) {
    if (!(f instanceof File)) continue;

    if (f.size < 1000) continue;
    if (f.size > MAX_FILE_BYTES) {
      return err("FILE_TOO_LARGE", `Максимум ${MAX_FILE_BYTES} bytes`, 400);
    }

    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      return err("BAD_FILE_TYPE", `Ожидался image/* или video/*, пришло: ${f.type}`, 400);
    }

    const ext =
      (f.name?.split(".").pop() || "").toLowerCase() ||
      (f.type.split("/")[1] || "bin");

    const path = `orders/${orderId}/${crypto.randomUUID()}.${ext}`;

    const buf = Buffer.from(await f.arrayBuffer());

    const up = await sb.storage.from("order-media").upload(path, buf, {
      contentType: f.type,
      upsert: false,
    });

    if (up.error) return err("UPLOAD_FAILED", up.error.message, 500);

    const ins = await sb
      .from("order_media")
      .insert({
        order_id: orderId,
        path,
        mime: f.type,
        size: f.size,
        kind: kindFromMime(f.type),
      })
      .select("id, path, mime, size, kind, created_at")
      .single();

    if (ins.error) return err("DB_INSERT_FAILED", ins.error.message, 500);

    // private bucket -> сразу выдаём signed url мастеру
    const signed = await sb.storage.from("order-media").createSignedUrl(path, 60 * 10);

    uploaded.push({
      ...ins.data,
      url: signed.data?.signedUrl ?? null,
    });
  }

  // ✅ ключевой момент: дергаем orders.updated_at -> клиент (слушает orders) сам перетянет медиа
  await sb
    .from("orders")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return NextResponse.json({ items: uploaded });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) return err("BAD_REQUEST", "invalid order id");

  const sb = supabaseServer();

  const { data, error } = await sb
    .from("order_media")
    .select("id, path, mime, size, kind, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) return err("DB_SELECT_FAILED", error.message, 500);

  const items = await Promise.all(
    (data ?? []).map(async (m: any) => {
      const signed = await sb.storage
        .from("order-media")
        .createSignedUrl(m.path, 60 * 10);

      return { ...m, url: signed.data?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ items });
}
