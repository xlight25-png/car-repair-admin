"use client";

import { useState } from "react";

export default function LoginClient({ next = "/admin" }: { next?: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setBusy(true);

      const res = await fetch("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ password, next }),
});

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error?.message ?? "Не удалось войти");
        return;
      }

      const dest = data?.next ?? next ?? "/admin";

      // ВАЖНО: fetch сам не делает навигацию.
      // window.location.assign гарантирует, что куки + middleware применятся сразу.
      window.location.assign(dest);
    } catch (e) {
      console.error(e);
      setError("Ошибка сети при входе");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4"
      >
        <div className="text-xl font-black uppercase tracking-widest text-blue-500">
          Admin login
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
        />

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            busy || !password
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          {busy ? "Вхожу..." : "Войти"}
        </button>

        <div className="text-xs text-slate-500">
          После входа перекинет на: <span className="font-mono">{next}</span>
        </div>
      </form>
    </div>
  );
}
