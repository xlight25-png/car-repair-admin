"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function AdminSearchClient({ initialOrders = [], statuses = [] }: any) {
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  // Хелпер для обработки объекта автомобиля
  const formatVehicle = (vehicle: any) => {
    if (!vehicle) return "Без названия";
    if (typeof vehicle === 'string') return vehicle;
    // Если это объект из БД (как на скрине ошибки)
    const { make, model, year } = vehicle;
    return `${make || ''} ${model || ''} ${year || ''}`.trim() || "Автомобиль";
  };

  const filteredOrders = useMemo(() => {
    let res = [...initialOrders];
    if (filterStatus) res = res.filter(o => o.status_code === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(o => {
        const name = formatVehicle(o.vehicle).toLowerCase();
        return name.includes(s) || o.short_code?.toLowerCase().includes(s);
      });
    }
    return res;
  }, [initialOrders, filterStatus, search]);

  return (
    <div className="space-y-6">
      {/* Блок поиска */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            placeholder="Поиск по авто или коду..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-slate-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-slate-100 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            {statuses?.map((s: any) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all">
            Поиск
          </button>
        </div>
      </div>

      {/* Список результатов */}
      <div className="grid gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => (
            <Link 
              key={order.id} 
              href={`/admin/o/${order.id}`} 
              className="group block bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {formatVehicle(order.vehicle)}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    #{order.short_code}
                  </span>
                </div>
                <div className="bg-blue-900/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-800/30 text-xs font-bold uppercase">
                  {statuses.find((s: any) => s.code === order.status_code)?.label || order.status_code}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
            <p className="text-slate-500">Заказы не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}