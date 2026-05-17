import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.mkisnails.com";
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  ?? "https://mkisnails.com";

const ADMIN_HOST = safeHost(ADMIN_URL);
const SITE_HOST  = safeHost(SITE_URL);

function safeHost(u: string): string {
  try { return new URL(u).host; } catch { return ""; }
}

function isAdminHost(host: string): boolean {
  if (!host) return false;
  if (host === ADMIN_HOST) return true;
  // local dev: admin.localhost:3000, admin.lvh.me, etc.
  return host.startsWith("admin.");
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isSameOrigin(request: NextRequest): boolean {
  const origin  = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) return true; // non-browser client; auth still gates

  const allowed = new Set<string>();
  if (SITE_URL)  { try { allowed.add(new URL(SITE_URL).origin);  } catch {} }
  if (ADMIN_URL) { try { allowed.add(new URL(ADMIN_URL).origin); } catch {} }
  const host = request.headers.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    if (process.env.NODE_ENV !== "production") allowed.add(`http://${host}`);
  }
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);

  let candidate: string | null = origin;
  if (!candidate && referer) {
    try { candidate = new URL(referer).origin; } catch { candidate = null; }
  }
  return !!candidate && allowed.has(candidate);
}

function redirectToHost(request: NextRequest, targetHost: string, targetPath?: string) {
  const url = request.nextUrl.clone();
  url.host = targetHost;
  url.protocol = "https:";
  url.port = "";
  if (targetPath !== undefined) url.pathname = targetPath;
  return NextResponse.redirect(url, 308);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const host = request.headers.get("host") ?? "";
  const onAdminHost = isAdminHost(host);
  const adminPath = isAdminPath(pathname);

  // ── Host-level routing ────────────────────────────────────────────────
  // Main site must not serve any admin surface.
  if (!onAdminHost && adminPath && ADMIN_HOST) {
    return redirectToHost(request, ADMIN_HOST);
  }

  // Admin subdomain only serves the admin surface (plus session endpoints).
  if (onAdminHost && !adminPath) {
    // Allow internal session/auth endpoints used by the admin UI.
    const allowOnAdmin =
      pathname.startsWith("/api/me") ||
      pathname.startsWith("/api/auth");

    if (!allowOnAdmin) {
      if (pathname === "/") {
        // Land on the admin dashboard (auth check below will bounce to /admin/login).
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url, 308);
      }
      if (SITE_HOST) return redirectToHost(request, SITE_HOST);
    }
  }

  // ── Admin path: CSRF + auth ──────────────────────────────────────────
  if (!adminPath) return NextResponse.next();

  // CSRF defense for mutating admin API calls.
  if (pathname.startsWith("/api/admin") && method !== "GET" && method !== "HEAD") {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // /api/admin paths skip the redirect logic below — auth is enforced inside
  // each route via requireAdmin().
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Login route is public
  if (pathname === "/admin/login") return NextResponse.next();

  // Refresh Supabase session and read user state
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (pathname.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every request except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|gif|woff2?|css|js|map|txt|xml)$).*)",
  ],
};
