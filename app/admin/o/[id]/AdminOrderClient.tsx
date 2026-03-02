"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  CheckCircle2,
  Package,
  Wrench,
  Play,
  Search,
  Car,
  Settings,
  ClipboardCheck,
} from "lucide-react";

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
  id: number;
  short_code: string;
  status_code: string;
  report: string | null;
  parts?: string | null; // ✅ новое поле
  vehicle: Vehicle;
};

type MediaRow = {
  id: number;
  url: string | null;
  kind: "image" | "video";
  mime?: string | null;
  created_at?: string | null;
};

function iconForStatus(code: string) {
  switch (code) {
    case "RECEIVED":
      return CheckCircle2;
    case "DIAGNOSING":
      return Search;
    case "DISASSEMBLY":
      return Settings;
    case "WAITING_PARTS":
      return Package;
    case "PARTS_ARRIVED":
      return Package;
    case "FIXING":
      return Wrench;
    case "ASSEMBLY":
      return Settings;
    case "TEST_DRIVE":
      return Car;
    case "READY":
      return Play;
    case "COMPLETED":
      return ClipboardCheck;
    default:
      return CheckCircle2;
  }
}

export default function AdminOrderClient({
  order,
  statuses,
  orderId,
}: {
  order: OrderRow;
  statuses: StatusRow[];
  orderId: number;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status_code);
  const [report, setReport] = useState(order.report ?? "");
  const [busy, setBusy] = useState(false);

  // --- parts ---
  const [partsOpen, setPartsOpen] = useState(Boolean(order.parts?.trim()));
  const [parts, setParts] = useState(order.parts ?? "");
  const [partsBusy, setPartsBusy] = useState(false);
  const [partsErr, setPartsErr] = useState<string | null>(null);
  const [partsSaved, setPartsSaved] = useState(false);

  // --- media ---
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaErr, setMediaErr] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaRow[]>([]);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCurrentStatus(order.status_code);
    setReport(order.report ?? "");
    setParts(order.parts ?? "");
    setPartsOpen(Boolean(order.parts?.trim()));
  }, [order.status_code, order.report, order.parts]);

  const updateStatus = async (newStatus: string) => {
    try {
      setBusy(true);

      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status_code: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error?.message ?? "Ошибка смены статуса");
        return;
      }

      const next = data?.order?.status_code ?? newStatus;
      setCurrentStatus(next);
    } catch (e) {
      console.error(e);
      alert("Ошибка сети при смене статуса");
    } finally {
      setBusy(false);
    }
  };

  // -------- parts save --------
  const saveParts = async () => {
    try {
      setPartsBusy(true);
      setPartsErr(null);
      setPartsSaved(false);

      const res = await fetch("/api/orders/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, parts }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPartsErr(data?.error?.message ?? "Не удалось сохранить запчасти");
        return;
      }

      setPartsSaved(true);
      setTimeout(() => setPartsSaved(false), 1500);
    } catch (e) {
      console.error(e);
      setPartsErr("Ошибка сети при сохранении");
    } finally {
      setPartsBusy(false);
    }
  };

  // -------- media --------
  const loadMedia = async () => {
    try {
      setMediaErr(null);

      const res = await fetch(`/api/orders/${orderId}/media`, { method: "GET" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMediaErr(data?.error?.message ?? "Не удалось загрузить медиа");
        return;
      }

      setMedia(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error(e);
      setMediaErr("Ошибка сети при загрузке медиа");
    }
  };

  useEffect(() => {
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const uploadMedia = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setMediaBusy(true);
      setMediaErr(null);

      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));

      const res = await fetch(`/api/orders/${orderId}/media`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMediaErr(data?.error?.message ?? "Не удалось загрузить медиа");
        return;
      }

      await loadMedia();
    } catch (e) {
      console.error(e);
      setMediaErr("Ошибка сети при загрузке медиа");
    } finally {
      setMediaBusy(false);
    }
  };

  // -------- audio --------
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Браузер не поддерживает запись аудио.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream);
      mediaRecorder.current = mr;
      audioChunks.current = [];

      mr.ondataavailable = (event) => {
        if (event.data?.size) audioChunks.current.push(event.data);
      };

      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const mime = mr.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunks.current, { type: mime });

        if (audioBlob.size < 1000) {
          alert("Запись слишком короткая. Попробуй записать чуть дольше.");
          return;
        }

        const audioFile = new File([audioBlob], "recording.webm", { type: mime });

        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("orderId", String(orderId)); // ✅ ВАЖНО: из пропса

        try {
          setBusy(true);

          const response = await fetch("/api/ai/record", {
            method: "POST",
            body: formData,
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            alert(data?.error?.message ?? "Ошибка обработки записи");
            return;
          }

          if (data?.report) setReport(data.report);

          if (data?.status_applied && data?.order?.status_code) {
            setCurrentStatus(data.order.status_code);
          }

          if (
            !data?.status_applied &&
            data?.suggested_status_code &&
            (data?.confidence ?? 0) > 0
          ) {
            const c = Math.round((data.confidence ?? 0) * 100);
            const ok = confirm(
              `ИИ предлагает статус ${data.suggested_status_code} (уверенность ${c}%). Применить?`
            );
            if (ok) await updateStatus(String(data.suggested_status_code));
          }

          alert("Готово! Отчёт обновлён.");
        } catch (err) {
          console.error(err);
          alert("Не удалось отправить голос на сервер.");
        } finally {
          setBusy(false);
        }
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Не удалось получить доступ к микрофону.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorder.current;
    if (!mr) return;

    try {
      mr.stop();
    } catch {
      // ignore
    } finally {
      setIsRecording(false);
    }
  };

  const statusLabel =
    statuses.find((s) => s.code === currentStatus)?.label ?? currentStatus;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-black uppercase tracking-widest mb-8 text-blue-500 text-center">
          Mechanic Dashboard
        </h1>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="mb-6 text-center space-y-2">
            <h2 className="text-4xl font-bold italic text-white">
              {order.vehicle.make} {order.vehicle.model}
            </h2>
            <p className="text-slate-500 font-mono text-lg">
              {order.vehicle.license_plate} • {order.vehicle.year}
            </p>

            <div className="text-sm text-slate-400">
              Код для клиента:{" "}
              <span className="font-mono text-slate-100">{order.short_code}</span>
            </div>

            <div className="text-sm text-slate-400">
              Статус:{" "}
              <span className="text-slate-100 font-medium">{statusLabel}</span>
            </div>
          </div>

          {/* record */}
          <div className="relative flex justify-center mb-8">
            {isRecording && (
              <div className="absolute inset-0 bg-red-600 rounded-full blur-2xl opacity-40 animate-pulse" />
            )}

            <button
              disabled={busy}
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-90 transition-all border-[10px] border-slate-900 outline outline-2 ${
                isRecording
                  ? "bg-red-600 outline-red-600"
                  : "bg-blue-600 outline-blue-600"
              } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isRecording ? (
                <>
                  <Square size={40} color="white" fill="white" />
                  <span className="font-black uppercase text-[10px] tracking-[0.2em] text-white">
                    Stop
                  </span>
                </>
              ) : (
                <>
                  <Mic size={40} color="white" fill="white" />
                  <span className="font-black uppercase text-[10px] tracking-[0.2em] text-white">
                    Record
                  </span>
                </>
              )}
            </button>
          </div>

          {/* statuses */}
          <div className="grid grid-cols-4 gap-3 bg-slate-950 p-3 rounded-3xl border border-slate-800">
            {statuses.map((s) => {
              const Icon = iconForStatus(s.code);
              const active = s.code === currentStatus;

              return (
                <button
                  key={s.code}
                  disabled={busy}
                  onClick={() => updateStatus(s.code)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all ${
                    active ? "bg-slate-900" : "hover:bg-slate-900"
                  } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={s.label}
                >
                  <Icon size={22} className="text-blue-500" />
                  <span className="text-[10px] font-bold uppercase text-slate-400 text-center px-1">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* parts (collapsible) */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <button
              type="button"
              onClick={() => setPartsOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-xs uppercase tracking-widest text-slate-400">
                Запчасти
              </div>
              <div className="text-xs text-slate-500">
                {partsOpen ? "Свернуть" : "Развернуть"}
              </div>
            </button>

            {partsOpen && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={parts}
                  onChange={(e) => setParts(e.target.value)}
                  rows={6}
                  placeholder="Например: 1) Прокладка ГБЦ — заказана. 2) Болты ГБЦ — нужны. 3) Масло/фильтр — в наличии."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
                />

                {partsErr && (
                  <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
                    {partsErr}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={partsBusy}
                    onClick={saveParts}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      partsBusy
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-500"
                    }`}
                  >
                    {partsBusy ? "Сохраняю..." : "Сохранить"}
                  </button>

                  {partsSaved && (
                    <div className="text-xs text-emerald-400">Сохранено ✓</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* media */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-widest text-slate-400">
                Медиа (фото/видео)
              </div>

              <label
                className={`text-xs font-semibold rounded-xl px-3 py-2 transition-all ${
                  mediaBusy
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                }`}
              >
                {mediaBusy ? "Загружаю..." : "Добавить"}
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  disabled={mediaBusy}
                  onChange={(e) => uploadMedia(e.target.files)}
                />
              </label>
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
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                >
                  {m.kind === "video" ? (
                    <video controls className="h-40 w-full object-cover">
                      {m.url && <source src={m.url} type={m.mime ?? "video/mp4"} />}
                    </video>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url ?? ""}
                      alt="media"
                      className="h-40 w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* report */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
              Отчёт
            </div>
            <div className="text-sm whitespace-pre-wrap text-slate-100">
              {report?.trim() ? report : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
