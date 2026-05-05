import * as Sentry from "@sentry/nextjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dev = process.env.NODE_ENV === "development";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: dev ? 1.0 : 0.1,
  includeLocalVariables: true,
  enableLogs: true,
  // Profile during active traces; sample rate stacks on top of tracesSampleRate.
  profileLifecycle: "trace",
  profileSessionSampleRate: dev ? 1.0 : 0.1,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    nodeProfilingIntegration(),
  ],
});
