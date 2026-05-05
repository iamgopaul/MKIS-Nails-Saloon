import * as Sentry from "@sentry/nextjs";

const dev = process.env.NODE_ENV === "development";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  // Trace 100% in dev, ~5% in prod. Lower = less server CPU + smaller quota.
  tracesSampleRate: dev ? 1.0 : 0.05,
  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
