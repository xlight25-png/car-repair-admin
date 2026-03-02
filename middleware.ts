import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Проверяем наличие куки
  const isAuth = req.cookies.get("admin_session")?.value === "authenticated";

  // 2. Если идем в админку и мы не авторизованы
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!isAuth) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", path); // Чтобы после входа вернуться сюда
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Если мы авторизованы и зашли на страницу логина — редирект в админку
  if (path === "/admin/login" && isAuth) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

// Настройка путей, которые обрабатывает middleware
export const config = {
  matcher: ["/admin/:path*"],
};