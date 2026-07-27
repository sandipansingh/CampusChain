"use client";

import { useEffect, useRef } from "react";
import { useActivityFeedStore } from "../hooks/useActivityFeedStore";
import { ICON_COLORS } from "@/shared/stellar/eventDecoder";
import {
  X,
  ExternalLink,
  ArrowLeftRight,
  ShieldCheck,
  Ticket,
  Building2,
  Users,
  Droplets,
  HelpCircle,
  Inbox,
} from "lucide-react";

interface ActivityFeedPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function EventIcon({ icon }: { icon: string }) {
  const cls = "h-4 w-4";
  switch (icon) {
    case "transfer": return <ArrowLeftRight className={cls} />;
    case "escrow":   return <ShieldCheck className={cls} />;
    case "ticket":   return <Ticket className={cls} />;
    case "university": return <Building2 className={cls} />;
    case "membership": return <Users className={cls} />;
    case "faucet":   return <Droplets className={cls} />;
    case "role":     return <ShieldCheck className={cls} />;
    default:         return <HelpCircle className={cls} />;
  }
}

export function ActivityFeedPanel({ isOpen, onClose }: ActivityFeedPanelProps) {
  const items = useActivityFeedStore((s) => s.items);
  const markAllRead = useActivityFeedStore((s) => s.markAllRead);
  const clear = useActivityFeedStore((s) => s.clear);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mark all read when panel opens
  useEffect(() => {
    if (isOpen) markAllRead();
  }, [isOpen, markAllRead]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          aria-hidden="true"
        />
      )}

      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Activity Feed"
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-foreground">Activity Feed</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Live on-chain events · auto-refreshes every 4s
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close activity feed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  No live activity yet
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Contract events will appear here in real-time as they land on the Stellar ledger.
                </p>
              </div>
            </div>
          ) : (
            items.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                    ICON_COLORS[evt.color]
                  }`}
                >
                  <EventIcon icon={evt.icon} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-foreground leading-snug truncate">
                      {evt.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {evt.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {evt.message}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-medium text-foreground/80">
                      {evt.details}
                    </span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${evt.fullTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      title="View transaction on Stellar Expert"
                    >
                      <span className="font-mono">{evt.txHash}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0 text-center">
          <p className="text-[10px] text-muted-foreground">
            Showing up to 100 recent on-chain events
          </p>
        </div>
      </div>
    </>
  );
}

export default ActivityFeedPanel;
