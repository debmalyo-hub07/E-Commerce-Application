import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/search",
  "/cart",
  "/login",
  "/register",
  "/privacy-policy",
  "/terms",
];

const AUTH_REQUIRED_ROUTES = ["/account", "/checkout"];
const ADMIN_REQUIRED_ROUTES = ["/admin"];
const AUTH_API_ROUTES = ["/api/user"];
const ADMIN_API_ROUTES = ["/api/admin"];
const AUTH_ROUTES = ["/login", "/register"]; // redirect away if already authenticated

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token (null if not authenticated)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET!,
    salt:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined;
  const isAdmin = userRole === "ADMIN";

  // ── 1. Redirect authenticated users away from login/register ──
  if (AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    if (isAuthenticated) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
      return NextResponse.redirect(
        new URL(callbackUrl || "/", request.url)
      );
    }
    return NextResponse.next();
  }

  // ── 2. Protect /admin/* routes ────────────────────────────────
  if (ADMIN_REQUIRED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ── 3. Protect /account/* and /checkout/* ────────────────────
  if (AUTH_REQUIRED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 4. Protect /api/admin/* ───────────────────────────────────
  if (ADMIN_API_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required", error_code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, data: null, error: "Insufficient permissions", error_code: "FORBIDDEN" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // ── 5. Protect /api/user/* ────────────────────────────────────
  if (AUTH_API_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required", error_code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

export default proxy;
