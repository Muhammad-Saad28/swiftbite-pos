import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|login).*)",
  ],
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow root, login, public static assets
  if (path === "/" || path.startsWith("/login") || path.startsWith("/_next")) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}