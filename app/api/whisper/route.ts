import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const blob = formData.get('file') as Blob;

    if (!blob) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // ВАЖНО: Превращаем Blob в настоящий файл, который понимает Whisper
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    // 1. Расшифровка (Whisper)
    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, 'audio.wav'),
      model: "whisper-1",
    });

    console.log("Услышано:", transcription.text);

    // 2. Обработка (GPT)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
     messages: [
  { 
    role: "system", 
    content: `Ты — опытный мастер-приемщик в автосервисе. Твоя задача: взять сырой, возможно грубый или невнятный отчет механика и превратить его в КРАТКИЙ, КУЛЬТУРНЫЙ и ПРОФЕССИОНАЛЬНЫЙ отчет для клиента.

    ПРАВИЛА:
    1. Убирай маты и сленг, но сохраняй техническую суть.
    2. Если механик говорит о поломке — пиши о поломке вежливо.
    3. Формат отчета: "Выявлено: [суть]. Рекомендация: [что делать]".
    4. НЕ используй заглушки вроде 'Диагностика в процессе', если в тексте есть хоть какая-то информация о машине.`
  },
  { role: "user", content: transcription.text }
],
    });

    return NextResponse.json({ text: completion.choices[0].message.content });

  } catch (error: any) {
    // Выводим РЕАЛЬНУЮ причину ошибки в терминал VS Code
    console.error("ОШИБКА API:", error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}