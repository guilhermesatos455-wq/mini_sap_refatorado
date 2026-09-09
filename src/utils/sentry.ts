import * as Sentry from '@sentry/react';

export function initFrontendSentry() {
  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE || 'production',
    });
    console.log('[Sentry Frontend] Observability initialized successfully.');
  } catch (err) {
    console.warn('[Sentry Frontend] Initialization fallback:', err);
  }
}

export function captureFrontendError(error: Error, context?: Record<string, any>) {
  console.error('[Sentry Captured Error]:', error, context);
  try {
    Sentry.withScope(scope => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  } catch (e) {
    // Fallback
  }
}
