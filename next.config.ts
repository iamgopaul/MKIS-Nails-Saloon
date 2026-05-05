import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Security headers applied to every route. CSP is intentionally permissive
 * for inline scripts/styles because Next.js relies on them for hydration
 * and Tailwind/styled-jsx; we still lock down framing, plugins, form-action,
 * and the base URL — those are the high-value mitigations.
 *
 * Sentry traffic is tunnelled through /monitoring on our own origin, so the
 * connect-src doesn't need a sentry.io exception under normal operation —
 * we keep one anyway as a fallback for when the tunnel is bypassed.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Required by Sentry's browser profiler to access the JS Self-Profiling API.
  { key: "Document-Policy",           value: "js-profiling" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

// Source map upload + tunnel route. Org/project/auth-token are picked up from
// env at build time — without them, withSentryConfig is essentially a no-op
// pass-through, and runtime error reporting still works via the DSN.
export default withSentryConfig(nextConfig, {
  org:                   process.env.SENTRY_ORG,
  project:               process.env.SENTRY_PROJECT,
  authToken:             process.env.SENTRY_AUTH_TOKEN,
  silent:                !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute:           "/monitoring",
});
