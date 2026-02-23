import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Always allow public files and auth routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/signin") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 🚀 DEMO MODE BYPASS
  if (isDemoMode) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL("/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // RBAC enforcement
  if (pathname.startsWith("/api/inventory")) {
    const role = token.role as string | undefined;

    if ((req.method === "POST" || req.method === "DELETE") && role === "STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};