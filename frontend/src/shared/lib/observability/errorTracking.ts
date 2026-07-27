/**
 * shared/lib/observability/errorTracking.ts
 *
 * Single `captureError(error, context)` function used in every catch block.
 *
 * Design goals:
 *   - One call site convention — no raw console.error anywhere.
 *   - Structured: always logs a LogEntry via the logger (not a raw string).
 *   - Pluggable: the `ErrorReporter` interface is the only seam to wire Sentry,
 *     Rollbar, Highlight, or any custom endpoint — without touching any call site.
 *   - Safe: never throws. A broken reporter must not crash the user's action.
 *
 * Wiring Sentry later (zero call-site changes required):
 *   import * as Sentry from "@sentry/nextjs";
 *   import { setErrorReporter } from "@/shared/lib/observability/errorTracking";
 *   setErrorReporter({
 *     report: (err, ctx) => Sentry.captureException(err, { extra: ctx }),
 *   });
 *
 * Usage (in every catch block):
 *   import { captureError } from "@/shared/lib/observability";
 *   catch (err) {
 *     captureError(err, { action: "fetchBalance", address, contract: "campus-token" });
 *   }
 */

import { logger } from "./logger";

export interface ErrorContext {
  /** Human-readable action name, e.g. "fetchBalance", "executeTransfer" */
  action: string;
  /** Contract name or "horizon" or "rpc" */
  contract?: string;
  /** The wallet address involved (never log private keys) */
  walletAddress?: string;
  /** Transaction hash if available */
  txHash?: string;
  /** Any additional structured metadata */
  [key: string]: unknown;
}

/**
 * Reporter interface — the only seam to swap in a real APM provider.
 * The default no-op reporter relies solely on the logger output.
 */
export interface ErrorReporter {
  report: (error: unknown, context: ErrorContext) => void;
}

let _reporter: ErrorReporter = {
  /** Default: no-op — logging via logger is the only output until wired. */
  report: () => undefined,
};

const errorLog = logger.scope("error-tracker");

/**
 * Replace the active reporter at app startup.
 * Call this once in your root providers/layout.
 *
 * @example
 *   setErrorReporter({ report: (err, ctx) => Sentry.captureException(err, { extra: ctx }) });
 */
export function setErrorReporter(reporter: ErrorReporter): void {
  _reporter = reporter;
}

/**
 * Capture and report an error with structured context.
 * Safe to call from any catch block — never re-throws.
 *
 * @param error  The raw caught value (may be Error, string, or unknown).
 * @param context  Structured metadata about what was happening.
 */
export function captureError(error: unknown, context: ErrorContext): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Unknown error";

  const stack = error instanceof Error ? error.stack : undefined;

  errorLog.error(message, {
    ...context,
    ...(stack ? { stack } : {}),
  });

  try {
    _reporter.report(error, context);
  } catch {
    // Reporter must never crash the application
  }
}
