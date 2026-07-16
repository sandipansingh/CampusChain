/**
 * CampusChain Observability & Telemetry Service
 * Abstracts logging, error tracking, transaction profiling, and event monitoring.
 */

export interface TxTelemetry {
  hash: string;
  method: string;
  status: "pending" | "processing" | "confirmed" | "failed";
  durationMs?: number;
  errorMessage?: string;
}

class TelemetryLogger {
  private isDevelopment = process.env.NODE_ENV === "development";

  info(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context || "");
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context || "");
    }
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error || "", context || "");
    // Abstracted: Here you would transmit errors to third-party collectors (e.g. Sentry/Datadog)
    this.sendToCollector("ERROR_TRACKER", { message, error, context });
  }

  trackTransaction(telemetry: TxTelemetry) {
    this.info(`Transaction State Changed: ${telemetry.method} (${telemetry.status})`, {
      hash: telemetry.hash,
      durationMs: telemetry.durationMs,
      errorMessage: telemetry.errorMessage,
    });
    
    // Abstracted: Here you would log metrics to Datadog/Stellar event logger
    this.sendToCollector("METRICS_COLLECTOR", telemetry);
  }

  private sendToCollector(collectorType: string, payload: unknown) {
    // In production, send via navigator.sendBeacon or fetch queue
    if (!this.isDevelopment) {
      // Mock tracking call
      try {
        fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectorType, payload, timestamp: Date.now() }),
          keepalive: true,
        }).catch(() => {
          // Fail silently on mock analytics call
        });
      } catch {
        // Fail silently
      }
    }
  }
}

export const logger = new TelemetryLogger();
