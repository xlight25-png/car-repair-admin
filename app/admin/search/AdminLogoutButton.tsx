"use client";

import { useState } from "react";

export default function AdminLogoutButton() {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    try {
      setBusy(true);
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.assign("/admin/login?next=%2Fadmin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={logout}
      className={`rounded-xl px-3 py-2 text-sm font-semibold border border-slate-800 transition-all ${
        busy ? "text-slate-500 cursor-not-allowed" : "text-slate-200 hover:bg-slate-900"
      }`}
    >
      {busy ? "..." : "Выйти"}
    </button>
  );
}
