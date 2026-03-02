"use client";

import { useCallback, useState } from "react";
import ClientRealtime from "./ClientRealtime";

type OrderRow = {
  id: number;
  short_code: string;
  status_code: string;
  report: string | null;
  vehicle: any;
};

export default function ClientOrderView({ initialOrder }: { initialOrder: OrderRow }) {
  const [order, setOrder] = useState<OrderRow>(initialOrder);

  const onChange = useCallback((next: OrderRow) => {
    setOrder((prev) => ({ ...prev, ...next }));
  }, []);

  return (
    <>
      <ClientRealtime orderId={order.id} onChange={onChange} />

      {/* ниже оставь твой текущий UI, только вместо initialOrder используй order */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-slate-400 text-sm">Ваш автомобиль</div>
          <div className="text-3xl font-semibold text-slate-100">
            {order.vehicle?.make} {order.vehicle?.model} ({order.vehicle?.year})
          </div>
          <div className="text-slate-500 mt-1">
            Госномер: {order.vehicle?.license_plate}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-slate-400 text-sm">Статус</div>
          <div className="text-2xl font-semibold text-slate-100">
            {order.status_code}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-slate-400 text-sm">Отчет</div>
          <div className="text-slate-100 whitespace-pre-wrap mt-2">
            {order.report?.trim() ? order.report : "—"}
          </div>
        </div>
      </div>
    </>
  );
}
