import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ClientOrderLive from "./ClientOrderLive";

export const dynamic = "force-dynamic";

type StatusRow = {
  code: string;
  label: string;
  sort_order: number;
};

type Vehicle = {
  make: string;
  model: string;
  year: string;
  license_plate: string;
};

type OrderRow = {
  id: number;
  short_code: string;
  status_code: string;
  report: string | null;
  vehicle: Vehicle;
  updated_at?: string | null;
};

export default async function ClientOrderPage({ params }: { params: any }) {
  // ✅ Next 16.1.6: params может быть Promise
  const p = await Promise.resolve(params);
  const raw = p?.short_code;

  if (!raw) notFound();

  const shortCode = String(raw).toUpperCase();

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: order, error } = await sb
    .from("orders")
    .select("id, short_code, status_code, report, vehicle, updated_at")
    .eq("short_code", shortCode)
    .single<OrderRow>();

  if (error || !order) notFound();

  const { data: statuses } = await sb
    .from("order_statuses")
    .select("code,label,sort_order")
    .order("sort_order", { ascending: true })
    .returns<StatusRow[]>();

  return (
    <ClientOrderLive
      initialOrder={order}
      statuses={statuses ?? []}
      shortCode={shortCode}
    />
  );
}