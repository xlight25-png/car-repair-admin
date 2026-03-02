import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const STATUS_CODES = [
  "RECEIVED",
  "DIAGNOSING",
  "DISASSEMBLY",
  "WAITING_PARTS",
  "PARTS_ARRIVED",
  "FIXING",
  "ASSEMBLY",
  "TEST_DRIVE",
  "READY",
  "COMPLETED",
] as const;

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  const sb = supabaseServer();

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return err("BAD_REQUEST", "Invalid JSON body");
  }

  const orderId = Number(body?.orderId);
  const status_code = String(body?.status_code ?? "").toUpperCase();

  if (!Number.isFinite(orderId)) return err("BAD_REQUEST", "orderId must be a number");
  if (!status_code) return err("BAD_REQUEST", "status_code is required");

  const isValid = (STATUS_CODES as readonly string[]).includes(status_code);
  if (!isValid) return err("BAD_REQUEST", `Invalid status_code: ${status_code}`);

  const { data: updated, error } = await sb
    .from("orders")
    .update({ status_code })
    .eq("id", orderId)
    .select("id, short_code, status_code, report, vehicle, updated_at")
    .single();

  if (error || !updated) {
    return err("DB_UPDATE_FAILED", error?.message ?? "DB update failed", 500);
  }

  return NextResponse.json({ order: updated });
}
