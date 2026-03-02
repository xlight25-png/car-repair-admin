import { notFound } from "next/navigation";
import AdminOrderClient from "./AdminOrderClient";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Next 16
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const sb = supabaseServer();

  const { data: order, error } = await sb
    .from("orders")
    .select("id, short_code, status_code, report, vehicle, parts")
    .eq("id", orderId)
    .single();

  if (error || !order) notFound();

  const { data: statuses } = await sb
    .from("order_statuses")
    .select("code, label, sort_order")
    .order("sort_order", { ascending: true });

  return (
  <AdminOrderClient order={order} statuses={statuses ?? []} orderId={orderId} />

);

}
