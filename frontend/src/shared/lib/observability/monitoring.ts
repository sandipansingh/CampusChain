/**
 * shared/lib/observability/monitoring.ts
 *
 * Transaction lifecycle and contract event monitors.
 *
 * These two objects are the single integration point between the Phase 8
 * transaction store / Phase 9 event stream and the observability layer.
 * They produce structured log entries with all the metadata an APM tool
 * (Datadog, New Relic, Honeycomb) would need to build traces and dashboards.
 *
 * --- txMonitor ---
 * Called at every state transition inside client.ts / useTransactionStatusStore.
 * Emits one LogEntry per transition with:
 *   - tx hash (when available), method name, new status, wallet address,
 *     elapsed time, human-readable error, contract ID, ISO timestamp
 *
 * --- eventMonitor ---
 * Called once per batch of decoded Soroban events inside useContractEventStream.
 * Emits one LogEntry per event with:
 *   - event name, event type, ledger sequence, tx hash, details, timestamp
 *
 * Wiring to a real APM (example — Honeycomb OpenTelemetry):
 *   txMonitor.setTransport((entry) => otelSpan.addEvent(entry.action, entry));
 */

import { logger } from "./logger";

// ── Transaction lifecycle monitor ──────────────────────────────────────────

export interface TxLifecycleContext {
  /** The contract method being called, e.g. "transfer", "buy_item" */
  action: string;
  /** Current lifecycle state */
  status: "pending" | "processing" | "confirmed" | "failed";
  /** Wallet address initiating the transaction */
  walletAddress?: string;
  /** Contract ID this call targets (campus-token or campus-service address) */
  contractId?: string;
  /** Transaction hash — only available after submission */
  txHash?: string;
  /** How long the transaction has been processing (seconds) */
  elapsedSeconds?: number;
  /** Human-readable error string on failure */
  errorMessage?: string;
}

const txLog = logger.scope("tx-monitor");

export const txMonitor = {
  /**
   * Log a transaction lifecycle state transition.
   * Call once per state change from client.ts / useTransactionStatusStore.
   */
  record(ctx: TxLifecycleContext): void {
    const meta = {
      action: ctx.action,
      status: ctx.status,
      contractId: ctx.contractId,
      txHash: ctx.txHash,
      walletAddress: ctx.walletAddress,
      elapsedSeconds: ctx.elapsedSeconds,
      errorMessage: ctx.errorMessage,
      timestamp: new Date().toISOString(),
    };

    switch (ctx.status) {
      case "pending":
        txLog.info(`TX pending — awaiting wallet signature for "${ctx.action}"`, meta);
        break;
      case "processing":
        txLog.info(`TX processing — submitted to network, awaiting confirmation`, meta);
        break;
      case "confirmed":
        txLog.info(`TX confirmed ✓ — "${ctx.action}" succeeded`, meta);
        break;
      case "failed":
        txLog.warn(`TX failed ✗ — "${ctx.action}" error: ${ctx.errorMessage ?? "unknown"}`, meta);
        break;
    }
  },
};

// ── Contract event monitor ─────────────────────────────────────────────────

export interface EventMonitorContext {
  /** Decoded event name, e.g. "transfer", "escrow_released" */
  eventName: string;
  /** Human-readable event category */
  type: string;
  /** Ledger sequence this event was included in */
  ledger: number;
  /** Raw transaction hash */
  txHash: string;
  /** Human-readable event detail, e.g. "250.00 CAMP" */
  details: string;
  /** ISO timestamp from ledger close */
  ledgerClosedAt: string;
  /** Wallet address currently subscribed (the connected user) */
  subscribedAddress?: string;
}

const evtLog = logger.scope("event-monitor");

export const eventMonitor = {
  /**
   * Log a single decoded on-chain contract event.
   * Call once per decoded event inside useContractEventStream.
   */
  record(ctx: EventMonitorContext): void {
    evtLog.info(`Event received — ${ctx.eventName}`, {
      eventName: ctx.eventName,
      type: ctx.type,
      ledger: ctx.ledger,
      txHash: ctx.txHash,
      details: ctx.details,
      ledgerClosedAt: ctx.ledgerClosedAt,
      subscribedAddress: ctx.subscribedAddress,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log a batch of events received in a single poll tick.
   * Useful for volume metrics (N events per 4s interval).
   */
  recordBatch(events: EventMonitorContext[], subscribedAddress?: string): void {
    if (events.length === 0) return;
    evtLog.info(`Event batch — ${events.length} event(s) received from ledger`, {
      count: events.length,
      eventNames: events.map((e) => e.eventName),
      ledgerRange: {
        from: Math.min(...events.map((e) => e.ledger)),
        to: Math.max(...events.map((e) => e.ledger)),
      },
      subscribedAddress,
      timestamp: new Date().toISOString(),
    });
    // Record each event individually for per-event detail
    for (const evt of events) {
      this.record({ ...evt, subscribedAddress });
    }
  },
};
