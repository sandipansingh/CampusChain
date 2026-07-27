/**
 * shared/lib/observability/logger.ts
 *
 * Lightweight, structured logger abstraction.
 *
 * Design goals:
 *   - No vendor lock-in: zero external dependencies. The `transport` function
 *     is the only seam — swap it once to wire Datadog/Logtail/stdout JSON.
 *   - Structured first: every log call produces a plain LogEntry object.
 *     The console render is secondary.
 *   - Level-gated: info/warn only appear in development; error always appears.
 *   - Scoped: `logger.scope("wallet")` returns a child logger that prefixes
 *     every message with that scope name for easier grepping.
 *
 * Usage:
 *   import { logger } from "@/shared/lib/observability";
 *   logger.info("Balance fetched", { address, balance });
 *   logger.warn("Fallback used", { reason: "RPC timeout" });
 *   logger.error("Transfer failed", { error, address });
 *
 *   // Scoped child logger (preferred in service files)
 *   const log = logger.scope("marketplace");
 *   log.info("Listing fetched", { count: listings.length });
 *
 * Wiring a real transport (e.g. Logtail) later:
 *   import { logger } from "@/shared/lib/observability";
 *   logger.setTransport((entry) => logtailClient.log(entry.message, entry));
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: keyof typeof LogLevel;
  scope: string;
  message: string;
  timestamp: string;
  context?: LogContext;
}

/** Pluggable transport. Replace this at runtime to forward logs to an APM. */
type Transport = (entry: LogEntry) => void;

const IS_DEV = process.env.NODE_ENV !== "production";
const IS_TEST = process.env.NODE_ENV === "test";

/** Console transport (default). Suppressed entirely in the test environment. */
const defaultTransport: Transport = (entry) => {
  if (IS_TEST) return;

  const prefix = `[${entry.level}] [${entry.timestamp}] [${entry.scope}]`;
  const ctx = entry.context && Object.keys(entry.context).length > 0 ? entry.context : undefined;

  switch (entry.level) {
    case "ERROR":
      console.error(prefix, entry.message, ctx ?? "");
      break;
    case "WARN":
      if (IS_DEV) console.warn(prefix, entry.message, ctx ?? "");
      break;
    case "DEBUG":
    case "INFO":
      if (IS_DEV) console.log(prefix, entry.message, ctx ?? "");
      break;
  }
};

class Logger {
  private _scope: string;
  private _minLevel: LogLevel;
  private _transport: Transport;

  constructor(scope = "app", minLevel = LogLevel.DEBUG, transport = defaultTransport) {
    this._scope = scope;
    this._minLevel = minLevel;
    this._transport = transport;
  }

  /** Returns a child logger with a nested scope name. Zero allocation if level is below min. */
  scope(name: string): Logger {
    return new Logger(`${this._scope}:${name}`, this._minLevel, this._transport);
  }

  /** Override the transport at runtime (e.g. to attach Sentry/Logtail). */
  setTransport(fn: Transport): void {
    this._transport = fn;
  }

  /** Override the minimum level (e.g. quieten in production). */
  setMinLevel(level: LogLevel): void {
    this._minLevel = level;
  }

  debug(message: string, context?: LogContext): void {
    this._emit(LogLevel.DEBUG, "DEBUG", message, context);
  }

  info(message: string, context?: LogContext): void {
    this._emit(LogLevel.INFO, "INFO", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this._emit(LogLevel.WARN, "WARN", message, context);
  }

  error(message: string, context?: LogContext): void {
    this._emit(LogLevel.ERROR, "ERROR", message, context);
  }

  private _emit(level: LogLevel, levelKey: keyof typeof LogLevel, message: string, context?: LogContext): void {
    if (level < this._minLevel) return;

    const entry: LogEntry = {
      level: levelKey,
      scope: this._scope,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    try {
      this._transport(entry);
    } catch {
      // Transport must never crash the application
    }
  }
}

/** Singleton root logger. Scope it per feature/service. */
export const logger = new Logger("campuschain");
