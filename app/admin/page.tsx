import { supabaseServer } from "@/lib/supabaseServer";
import AdminSearchClient from "./search/AdminSearchClient";
import Link from "next/link";

export default async function AdminPage() {
  const sb = supabaseServer();

  // 1. Загружаем статусы
  const { data: statuses } = await sb
    .from("order_statuses")
    .select("code, label")
    .order("sort_order", { ascending: true });

  // 2. Загружаем заказы (БЕЗ client_name, чтобы не было ошибки БД)
  const { data: orders, error: ordErr } = await sb
    .from("orders")
    .select("id, short_code, status_code, vehicle, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (ordErr) console.error("Ошибка загрузки заказов:", ordErr.message);

  return (
    <main className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-500">
            Панель управления
          </h1>
          
          {/* Кнопка на страницу создания заказа */}
          <Link 
            href="/admin/new" 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            + Новый заказ
          </Link>
        </div>

        {/* Передаем данные в клиентский компонент поиска */}
        <AdminSearchClient 
          initialOrders={orders ?? []} 
          statuses={statuses ?? []} 
        />
      </div>
    </main>
  );
}