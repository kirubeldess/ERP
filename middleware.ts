import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Only treat as authenticated if an access token cookie exists
  const hasAccess = Boolean(req.cookies.get("sb-access-token")?.value);

  if (hasAccess && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
}; 