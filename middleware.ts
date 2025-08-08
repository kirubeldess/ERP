import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Detect any Supabase cookie set by @supabase/ssr or helpers
  const hasSupabaseCookie = req.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  if (hasSupabaseCookie && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
}; 