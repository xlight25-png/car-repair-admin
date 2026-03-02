import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sb = supabaseServer();

  const orderId = Number(params.id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "invalid order id" } },
      { status: 400 }
    );
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const status_code = String(body?.status_code ?? "").toUpperCase();
  if (!status_code) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "status_code is required" } },
      { status: 400 }
    );
  }

  // (необязательно, но полезно) убедимся что статус есть в справочнике
  const { data: st, error: stErr } = await sb
    .from("order_statuses")
    .select("code")
    .eq("code", status_code)
    .maybeSingle();

  if (stErr) {
    return NextResponse.json(
      { error: { code: "DB_READ_FAILED", message: stErr.message } },
      { status: 500 }
    );
  }

  if (!st) {
    return NextResponse.json(
      { error: { code: "BAD_STATUS", message: "unknown status_code" } },
      { status: 400 }
    );
  }

  const { data: order, error } = await sb
    .from("orders")
    .update({ status_code })
    .eq("id", orderId)
    .select("id, status_code, updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "DB_UPDATE_FAILED", message: error.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ order });
}
