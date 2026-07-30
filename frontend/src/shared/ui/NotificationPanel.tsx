"use client";

import { useEffect, useRef } from "react";
import { useNotificationStore } from "../hooks/useNotificationStore";
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
  Check,
} from "lucide-react";

interface NotificationPanelProps {
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

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const items = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const clear = useNotificationStore((s) => s.clear);
  const panelRef = useRef<HTMLDivElement>(null);

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
        aria-label="Notifications"
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-foreground">Notifications</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Live alerts · auto-refreshes in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.some((i) => !i.read) && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-primary hover:text-primary/80 transition-colors font-semibold cursor-pointer"
              >
                Mark all read
              </button>
            )}
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
              aria-label="Close notifications panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border/60">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Updates about profile approvals, CAMP payments, and order statuses will appear here in real-time.
                </p>
              </div>
            </div>
          ) : (
            items.map((evt) => {
              const isActionable = 
                evt.eventName === "UniversityRegistered" || 
                evt.eventName === "ProfileSubmittedForVerification" ||
                evt.eventName === "transfer" ||
                evt.eventName === "mint_purchase" ||
                evt.eventName === "OrderPlaced" ||
                evt.eventName === "OrderStatusChanged";

              const handleClick = () => {
                // Mark read on click
                if (!evt.read) {
                  markRead(evt.id);
                }

                if (evt.eventName === "UniversityRegistered") {
                  window.dispatchEvent(new CustomEvent("campuschain:navigate", { detail: "queue" }));
                  onClose();
                } else if (evt.eventName === "ProfileSubmittedForVerification") {
                  window.dispatchEvent(new CustomEvent("campuschain:navigate", { detail: "requests" }));
                  onClose();
                } else if (evt.eventName === "transfer" || evt.eventName === "mint_purchase") {
                  window.dispatchEvent(new CustomEvent("campuschain:navigate", { detail: "activity-feed" }));
                  onClose();
                } else if (evt.eventName === "OrderPlaced") {
                  window.dispatchEvent(new CustomEvent("campuschain:navigate", { detail: "incoming-orders" }));
                  onClose();
                } else if (evt.eventName === "OrderStatusChanged") {
                  window.dispatchEvent(new CustomEvent("campuschain:navigate", { detail: "my-orders" }));
                  onClose();
                }
              };

              return (
                <div
                  key={evt.id}
                  className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors relative group ${
                    isActionable ? "cursor-pointer" : ""
                  } ${!evt.read ? "bg-muted/10" : ""}`}
                  onClick={isActionable ? handleClick : undefined}
                >
                  {/* Unread indicator dot */}
                  {!evt.read && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}

                  {/* Icon */}
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      ICON_COLORS[evt.color]
                    }`}
                  >
                    <EventIcon icon={evt.icon} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-10">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-bold text-foreground leading-snug truncate ${!evt.read ? "font-extrabold" : ""}`}>
                        {evt.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {evt.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {evt.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 gap-2 min-w-0">
                      <span className="text-[10px] font-medium text-foreground/80 truncate" title={evt.details}>
                        {evt.details}
                      </span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${evt.fullTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        title="View transaction on Stellar Expert"
                      >
                        <span className="font-mono">{evt.txHash}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Action buttons (Visible on hover on desktop, or absolute placed) */}
                  <div className="absolute right-3 top-3.5 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity bg-transparent">
                    {!evt.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(evt.id);
                        }}
                        className="p-1 rounded-md border border-border bg-card text-muted-foreground hover:text-emerald-600 transition-colors cursor-pointer hover:border-emerald-600"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(evt.id);
                      }}
                      className="p-1 rounded-md border border-border bg-card text-muted-foreground hover:text-destructive transition-colors cursor-pointer hover:border-destructive"
                      title="Dismiss notification"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0 text-center">
          <p className="text-[10px] text-muted-foreground">
            Showing up to 100 recent notifications
          </p>
        </div>
      </div>
    </>
  );
}

export default NotificationPanel;
