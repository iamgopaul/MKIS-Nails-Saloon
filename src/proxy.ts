import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isSameOrigin(request: NextRequest): boolean {
  const origin  = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) return true; // non-browser client; auth still gates

  const allowed = new Set<string>();
  const envSite = process.env.NEXT_PUBLIC_SITE_URL;
  if (envSite) {
    try { allowed.add(new URL(envSite).origin); } catch {}
  }
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // CSRF defense for mutating admin API calls — even though they require an
  // admin session, cookies travel with cross-origin requests.
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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
