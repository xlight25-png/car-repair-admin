import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { password, next } = await req.json();

    // ВАЖНО: проверь, что ADMIN_PASSWORD прописан в .env.local
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: { message: "Неверный пароль" } },
        { status: 401 }
      );
    }

    const dest = next || "/admin";
    const res = NextResponse.json({ success: true, next: dest });

    // Устанавливаем куку сессии
    res.cookies.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", // Если не указать '/', кука может быть видна только для /api
      maxAge: 60 * 60 * 24 * 7, // 1 неделя
    });

    return res;
  } catch (e) {
    return NextResponse.json({ error: { message: "Ошибка сервера" } }, { status: 500 });
  }
}