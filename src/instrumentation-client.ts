import * as Sentry from "@sentry/nextjs";

const dev = process.env.NODE_ENV === "development";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  // Sample 10% of traces in dev, 0% in prod — distributed tracing isn't
  // worth the bundle weight on a small public site. Errors still report.
  tracesSampleRate: dev ? 0.1 : 0,
  // Replay only when an error fires, never as background sessions.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
