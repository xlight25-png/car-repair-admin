"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Vehicle = {
  make: string;
  model: string;
  year: string;
  license_plate: string;
};

export default function CreateOrderForm() {
  const router = useRouter();

  const [vehicle, setVehicle] = useState<Vehicle>({
    make: "",
    model: "",
    year: "",
    license_plate: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const make = vehicle.make.trim();
    const model = vehicle.model.trim();
    const year = vehicle.year.trim();
    const plate = vehicle.license_plate.trim();

    if (!make || !model || !plate) return false;
    if (!/^\d{4}$/.test(year)) return false;
    return true;
  }, [vehicle]);

  const onChange =
    (key: keyof Vehicle) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value;

      if (key === "year") v = v.replace(/[^\d]/g, "").slice(0, 4);
      if (key === "license_plate") v = v.toUpperCase();

      setVehicle((prev) => ({ ...prev, [key]: v }));
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      vehicle: {
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: vehicle.year.trim(),
        license_plate: vehicle.license_plate.trim().toUpperCase(),
      },
    };

    try {
      setBusy(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

     // ✅ поддерживаем оба формата ответа: { id, short_code } и { order: { id, short_code } }
const created = data?.order ?? data;
const id = created?.id;
const shortCode = created?.short_code;

if (!id) {
  setError(`Создали заказ, но не получили id. Ответ: ${JSON.stringify(data)}`);
  return;
}

router.push(`/admin/o/${id}`);

if (!id) {
  setError(`Создали заказ, но не получили id. Ответ: ${JSON.stringify(data)}`);
  return;
}

router.push(`/admin/o/${id}`);
    } catch (err) {
      console.error(err);
      setError("Ошибка сети (fetch). Проверь dev-server / интернет / CORS.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="text-xs uppercase tracking-widest text-slate-400">
          Данные автомобиля
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <input
            value={vehicle.make}
            onChange={onChange("make")}
            placeholder="Марка (например, BMW)"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
          />
          <input
            value={vehicle.model}
            onChange={onChange("model")}
            placeholder="Модель (например, X5)"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={vehicle.year}
              onChange={onChange("year")}
              placeholder="Год (YYYY)"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
            />
            <input
              value={vehicle.license_plate}
              onChange={onChange("license_plate")}
              placeholder="Госномер (например, M777MM174)"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              !canSubmit || busy
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {busy ? "Создаю..." : "Создать заказ"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => router.push("/admin")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border border-slate-800 transition-all ${
              busy
                ? "text-slate-500 cursor-not-allowed"
                : "text-slate-200 hover:bg-slate-900"
            }`}
          >
            Назад
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Под капотом: данные уйдут в <span className="font-mono">/api/orders</span>, база
          проверит обязательные поля.
        </div>
      </div>
    </form>
  );
}
