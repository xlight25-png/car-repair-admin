"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: number;
  short_code: string;
  status_code: string;
  report: string | null;
  vehicle: any;
};

export default function ClientRealtime({
  orderId,
  onChange,
}: {
  orderId: number;
  onChange: (next: OrderRow) => void;
}) {
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = payload.new as OrderRow;
          onChange(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onChange]);

  return null;
}
