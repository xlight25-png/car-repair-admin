"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const go = () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    router.push(`/o/${normalized}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Проверка заказа</h1>
        <p className="text-sm text-gray-600">Введите короткий код (например, 7A2B9X)</p>

        <input
          className="w-full rounded-md border p-2"
          placeholder="Код заказа"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />

        <button className="w-full rounded-md bg-black text-white p-2" onClick={go}>
          Открыть
        </button>
      </div>
    </main>
  );
}
