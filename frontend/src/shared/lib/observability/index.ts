/**
 * shared/lib/observability/index.ts
 *
 * Public barrel export — all call sites import from here.
 * Importing this file is always safe (no side-effects on import).
 */
export { logger, LogLevel, type LogContext, type LogEntry } from "./logger";
export { captureError, type ErrorContext } from "./errorTracking";
export { txMonitor, eventMonitor, type TxLifecycleContext, type EventMonitorContext } from "./monitoring";
