import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

const protectedPaths = [
  "/overview",
  "/knowledge-base",
  "/ai-employees",
  "/agent-teams",
  "/workflows",
  "/research-hub",
  "/browser-automation",
  "/customer-support",
  "/voice-ai",
  "/omnichannel",
  "/analytics",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtectedRoute = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/knowledge-base/:path*",
    "/ai-employees/:path*",
    "/agent-teams/:path*",
    "/workflows/:path*",
    "/research-hub/:path*",
    "/browser-automation/:path*",
    "/customer-support/:path*",
    "/voice-ai/:path*",
    "/omnichannel/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
