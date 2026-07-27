/**
 * shared/lib/logger.ts
 *
 * Compatibility shim — re-exports everything from the new observability module.
 *
 * The original TelemetryLogger class has been replaced by the structured
 * observability layer in shared/lib/observability/. Any code that was
 * importing `logger` from this path continues to work unchanged.
 *
 * To migrate call sites to the new API:
 *   Old: import { logger } from "@/shared/lib/logger";
 *   New: import { logger } from "@/shared/lib/observability";
 */
export { logger, LogLevel } from "./observability";
export type { LogContext, LogEntry } from "./observability";
export { captureError } from "./observability";
export type { ErrorContext } from "./observability";
export { txMonitor, eventMonitor } from "./observability";
export type { TxLifecycleContext, EventMonitorContext } from "./observability";
