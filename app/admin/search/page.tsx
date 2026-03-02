import { supabaseServer } from "@/lib/supabaseServer";
import AdminSearchClient from "./AdminSearchClient";
import { notFound } from "next/navigation";

export default async function AdminPage() {
  const sb = supabaseServer();

  // 1. Загружаем статусы
  const { data: statuses, error: stErr } = await sb
    .from("order_statuses")
    .select("code, label")
    .order("sort_order", { ascending: true });

  if (stErr) notFound();

  // 2. Загружаем заказы
  const { data: orders } = await sb
    .from("orders")
    .select("id, short_code, status_code, vehicle, client_name, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <main className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-500 mb-8">
          Панель управления
        </h1>

        {/* Передаем данные в клиентский компонент */}
        <AdminSearchClient 
          initialOrders={orders ?? []} 
          statuses={statuses ?? []} 
        />
      </div>
    </main>
  );
}