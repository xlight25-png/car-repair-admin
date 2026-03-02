"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  short_code: string;
  status_code: string;
  report: string | null;
  vehicle: Vehicle;
  updated_at?: string | null;
};

type MediaRow = {
  id: number;
  url: string | null;
  kind: "image" | "video";
  mime?: string | null;
  created_at?: string | null;
};

function formatDt(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU");
}

export default function ClientOrderLive({
  initialOrder,
  statuses,
  shortCode,
}: {
  initialOrder: OrderRow;
  statuses: StatusRow[];
  shortCode: string; // уже UPPERCASE
}) {
  const [order, setOrder] = useState<OrderRow>(initialOrder);

  const [media, setMedia] = useState<MediaRow[]>([]);
  const [mediaErr, setMediaErr] = useState<string | null>(null);

  const statusMap = useMemo(() => {
    return new Map(statuses.map((s) => [s.code, s.label]));
  }, [statuses]);

  const currentIndex = useMemo(() => {
    const idx = statuses.findIndex((s) => s.code === order.status_code);
    return idx === -1 ? 0 : idx;
  }, [statuses, order.status_code]);

  const loadMedia = async () => {
    try {
      setMediaErr(null);
      const res = await fetch(`/api/o/${shortCode}/media`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setMediaErr(data?.error?.message ?? "Не удалось загрузить медиа");
        return;
      }

      setMedia(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setMediaErr("Ошибка сети при загрузке медиа");
    }
  };

  useEffect(() => {
    // ✅ Realtime: слушаем только свой short_code
    const channel = supabase
      .channel(`order_${shortCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `short_code=eq.${shortCode}`,
        },
        (payload) => {
          const next = payload.new as any;
          setOrder((prev) => ({ ...prev, ...next }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shortCode]);

  // первичная загрузка медиа
  useEffect(() => {
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortCode]);

  // авто-рефетч медиа при любом обновлении заказа (мы “touch” updated_at на сервере после upload)
  useEffect(() => {
    if (order.updated_at) loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.updated_at]);

  const statusLabel = statusMap.get(order.status_code) ?? order.status_code;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Авто */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Ваш автомобиль
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {order.vehicle.make} {order.vehicle.model} ({order.vehicle.year})
          </div>
          <div className="mt-1 text-slate-300">
            Госномер:{" "}
            <span className="font-mono">{order.vehicle.license_plate}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Обновлено: {formatDt(order.updated_at)}
          </div>
        </div>

        {/* Статус + путь */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400">
                Статус
              </div>
              <div className="mt-2 text-xl font-semibold">{statusLabel}</div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Код заказа</div>
              <div className="font-mono text-slate-200">{order.short_code}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {statuses.map((s, idx) => {
              const isDone = idx < currentIndex;
              const isActive = idx === currentIndex;

              return (
                <div key={s.code} className="flex items-center gap-3">
                  <div
                    className={[
                      "h-3 w-3 rounded-full",
                      isDone
                        ? "bg-blue-500"
                        : isActive
                        ? "bg-blue-500 ring-4 ring-blue-500/20"
                        : "bg-slate-700",
                    ].join(" ")}
                  />
                  <div
                    className={[
                      "text-sm",
                      isDone
                        ? "text-slate-300"
                        : isActive
                        ? "text-white"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Медиа */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Фото / видео
          </div>

          {mediaErr && (
            <div className="mt-3 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
              {mediaErr}
            </div>
          )}

          {!mediaErr && media.length === 0 && (
            <div className="mt-3 text-sm text-slate-500">Пока нет медиа.</div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {media.map((m) => (
              <div
                key={m.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
              >
                {m.kind === "video" ? (
                  <video controls className="h-48 w-full object-cover">
                    {m.url && <source src={m.url} type={m.mime ?? "video/mp4"} />}
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url ?? ""}
                    alt="media"
                    className="h-48 w-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Отчет */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Отчет
          </div>
          <div className="mt-3 whitespace-pre-wrap text-slate-100">
            {order.report?.trim() ? order.report : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
