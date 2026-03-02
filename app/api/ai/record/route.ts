import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const STATUS_CODES = [
  "RECEIVED",
  "DIAGNOSING",
  "DISASSEMBLY",
  "WAITING_PARTS",
  "PARTS_ARRIVED",
  "FIXING",
  "ASSEMBLY",
  "TEST_DRIVE",
  "READY",
  "COMPLETED",
] as const;

type StatusCode = (typeof STATUS_CODES)[number];

type AiResult = {
  report: string;
  suggested_status_code: string;
  confidence: number; // 0..1
};

function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function parseOrderId(form: FormData): number | null {
  const raw =
    form.get("orderId") ??
    form.get("order_id") ??
    form.get("id");

  if (raw == null) return null;

  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
}

function toFile(blob: Blob, fallbackName = "recording.webm"): File {
  // Если уже File — оставляем
  if (blob instanceof File) return blob;
  const type = blob.type || "audio/webm";
  return new File([blob], fallbackName, { type });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return err("CONFIG_MISSING", "OPENAI_API_KEY is missing", 500);
  }

  const sb = supabaseServer();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("BAD_REQUEST", "Expected multipart/form-data", 400);
  }

  const filePart = form.get("file");
  if (!(filePart instanceof Blob)) {
    return err("BAD_REQUEST", "file is required (FormData)", 400);
  }

  const orderId = parseOrderId(form);
  if (!orderId) {
    return err("BAD_REQUEST", "invalid order id", 400);
  }

  const file = toFile(filePart);

  if (file.size < 1000) {
    return err("AUDIO_TOO_SMALL", "Запись слишком короткая", 400);
  }

  // Иногда браузер может прислать пустой type — не валим сразу
  if (file.type && !file.type.startsWith("audio/") && !file.type.includes("webm")) {
    return err("BAD_FILE_TYPE", `Ожидался audio/*, пришло: ${file.type}`, 400);
  }

  // 1) Whisper
  let transcript = "";
  try {
    const tr = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
    });
    transcript = (tr.text ?? "").trim();
  } catch (e: any) {
    return err("WHISPER_FAILED", e?.message ?? "Whisper failed", 500);
  }

  if (!transcript || transcript.length < 5) {
    return err("EMPTY_TRANSCRIPT", "Whisper вернул пустой текст", 400);
  }

  // 2) GPT: полировка + предложение статуса
  const system = `
Ты — опытный мастер-приёмщик в автосервисе.
Твоя задача: перевести «гаражную» речь механика в корректный отчёт для клиента.

Правила:
- Убирай мат и жаргон, но сохраняй техническую суть.
- Пиши по-русски, профессионально, ясно.
- Формат отчёта:
  "Выявлено: ...
   Рекомендация: ..."
- Не добавляй выдуманные детали. Только то, что есть в тексте.

Дополнительно: предложи следующий статус заказа из списка:
${STATUS_CODES.join(", ")}

Верни СТРОГО JSON:
{
  "report": string,
  "suggested_status_code": string,
  "confidence": number
}

confidence — от 0.0 до 1.0.
Если ты не уверен, ставь confidence < 0.7.
`.trim();

  let ai: AiResult | null = null;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    ai = safeJsonParse<AiResult>(content);
  } catch (e: any) {
    return err("GPT_FAILED", e?.message ?? "GPT failed", 500);
  }

  if (!ai?.report || typeof ai.report !== "string") {
    return err("BAD_GPT_JSON", "GPT вернул некорректный JSON", 500);
  }

  const suggestedRaw = String(ai.suggested_status_code ?? "").toUpperCase();
  const confidence = Number(ai.confidence ?? 0);

  const isValidStatus = (STATUS_CODES as readonly string[]).includes(suggestedRaw);
  const suggested = (isValidStatus ? suggestedRaw : null) as StatusCode | null;

  const canApplyStatus = Boolean(suggested && Number.isFinite(confidence) && confidence >= 0.7);

  // 3) Update orders на сервере (единая точка правды)
  const patch: Partial<{
    report: string;
    status_code: StatusCode;
  }> = {
    report: ai.report,
  };

  if (canApplyStatus && suggested) {
    patch.status_code = suggested;
  }

  const { data: updated, error: updateError } = await sb
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .select("id, short_code, status_code, report, vehicle, updated_at")
    .single();

  if (updateError || !updated) {
    return err("DB_UPDATE_FAILED", updateError?.message ?? "DB update failed", 500);
  }

  return NextResponse.json({
    transcript,
    report: updated.report,
    suggested_status_code: suggested,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    status_applied: canApplyStatus,
    order: updated,
  });
}
