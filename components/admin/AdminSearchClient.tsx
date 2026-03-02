"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const formatDate = (date: string) => new Date(date).toLocaleString("ru-RU");

interface Props {
  initialOrders: any[];
  statuses: any[];
}

export default function AdminSearchClient({ initialOrders = [], statuses = [] }: Props) {
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  // ГЛАВНОЕ ИЗМЕНЕНИЕ:
  // Вместо useState + useEffect используем useMemo.
  // Это вычисляет список только тогда, когда меняются фильтры или исходные данные.
  const orders = useMemo(() => {
    let res = initialOrders;

    // 1. Фильтр по статусу
    if (filterStatus) {
      res = res.filter((o) => o.status_code === filterStatus);
    }

    // 2. Поиск
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(
        (o) =>
          o.vehicle?.toLowerCase().includes(s) ||
          o.client_name?.toLowerCase().includes(s) ||
          o.short_code?.toLowerCase().includes(s)
      );
    }

    return res;
  }, [initialOrders, filterStatus, search]);

  return (
    <div className="space-y-6">
      {/* --- БЛОК ПОИСКА И ФИЛЬТРОВ --- */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <input
          placeholder="Поиск по авто, клиенту или коду..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <select
          className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-slate-100"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Все статусы</option>
          {statuses.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
        
        <Link 
          href="/admin/new"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg text-center transition-colors flex items-center justify-center"
        >
          + Новый заказ
        </Link>
      </div>

      {/* --- СПИСОК ЗАКАЗОВ --- */}
      <div className="grid gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/o/${order.id}`}
            className="block bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-blue-500 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400">
                  {order.vehicle}
                </h3>
                <p className="text-slate-400 text-sm">
                  {order.client_name} • {order.client_phone}
                </p>
                <div className="mt-2 text-xs font-mono bg-slate-950 inline-block px-2 py-1 rounded text-slate-500 border border-slate-800">
                  {order.short_code}
                </div>
              </div>
              
              <div className="text-right">
                 <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 mb-2 border border-slate-700">
                    {statuses.find(s => s.code === order.status_code)?.label || order.status_code}
                 </span>
                 <div className="text-xs text-slate-600">
                   {formatDate(order.updated_at || order.created_at)}
                 </div>
              </div>
            </div>
          </Link>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            Заказов не найдено
          </div>
        )}
      </div>
    </div>
  );
}