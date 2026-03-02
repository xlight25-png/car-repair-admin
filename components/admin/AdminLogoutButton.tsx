"use client";

import { useState } from "react";

export default function AdminLogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    try {
      setBusy(true);
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      // жесткий переход, чтобы куки/мидлварь точно применились
      window.location.assign("/admin/login?next=%2Fadmin");
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={logout}
      className={`rounded-xl px-4 py-2 text-sm font-semibold border border-slate-800 transition-all ${
        busy
          ? "text-slate-500 cursor-not-allowed"
          : "text-slate-200 hover:bg-slate-900"
      } ${className}`}
    >
      {busy ? "Выхожу..." : "Выйти"}
    </button>
  );
}
