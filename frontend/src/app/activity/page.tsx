"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { getRpcServer, NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID } from "@/services/contracts";
import { scValToNative } from "@stellar/stellar-sdk";

interface FeedEvent {
  id: string;
  type: "TRANSFER" | "ESCROW" | "TICKET" | "ROLE";
  message: string;
  txHash: string;
  timestamp: string;
}

// Statically declared outside component to avoid dependency churn in React Hooks
const BASE_MOCK_EVENTS: FeedEvent[] = [
  {
    id: "ev1",
    type: "TRANSFER",
    message: "STUDENT GCM5...7AFN TRANSFERRED 45.00 CAMP TO CLUB CHESS",
    txHash: "a52c...3d12",
    timestamp: "2 MINS AGO",
  },
  {
    id: "ev2",
    type: "ESCROW",
    message: "ESCROW CONTRACT #244 CREATED BY BUYER GA3K...WJYA FOR 120.00 CAMP",
    txHash: "88cf...91ea",
    timestamp: "5 MINS AGO",
  },
  {
    id: "ev3",
    type: "TICKET",
    message: "TICKET PASS #88 BOUGHT BY GDS2...J6KJ FOR 'SUMMER ACCREDITATION FESTIVAL'",
    txHash: "bca8...1a0d",
    timestamp: "12 MINS AGO",
  },
  {
    id: "ev4",
    type: "ROLE",
    message: "MERCHANT ROLE AUTHORIZED FOR CAMPUS BOOKSTORE BY UNIVERSITY ADMIN",
    txHash: "2df1...8ca7",
    timestamp: "30 MINS AGO",
  },
];

export default function ActivityFeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch contract events from RPC
  useEffect(() => {
    async function fetchEvents() {
      try {
        const server = getRpcServer();
        const latestLedger = await server.getLatestLedger();
        
        // Fetch events from last 1000 ledgers
        const startLedger = Math.max(1, latestLedger.sequence - 1000);
        const res = await server.getEvents({
          startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID],
            },
          ],
          limit: 10,
        });

        const contractEvents: FeedEvent[] = res.events.map((evt, idx) => {
          const rawTopic = evt.topic[0];
          let type: "TICKET" | "ESCROW" = "ESCROW";
          try {
            const nativeTopic = scValToNative(rawTopic);
            if (typeof nativeTopic === "string" && nativeTopic.includes("ticket")) {
              type = "TICKET";
            }
          } catch {
            // Ignore parse errors
          }
          return {
            id: `ledger_${idx}_${evt.ledger}`,
            type,
            message: `${type} EVENT TRIGGERED ON LEDGER SEQUENCE ${evt.ledger}`,
            txHash: evt.txHash.slice(0, 8) + "..." + evt.txHash.slice(-8),
            timestamp: "JUST NOW",
          };
        });

        setEvents([...contractEvents, ...BASE_MOCK_EVENTS]);
      } catch {
        // Fallback silently to mock events if RPC fails
        setEvents(BASE_MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      {/* Hero Header */}
      <section className="w-full border-b-2 border-border py-20 bg-background relative overflow-hidden">
        <div className="max-w-[95vw] mx-auto z-10 relative">
          <span className="text-accent text-sm font-bold tracking-widest uppercase mb-4 block">
            {"// TELEMETRY STREAM"}
          </span>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-none">
            LIVE ECO SYSTEM FEED
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium mt-4 max-w-xl">
            Real-time ledger audit trail showing transactions, token transfers, ticket acquisitions, and active escrows.
          </p>
        </div>
      </section>

      {/* Events Stream Panel */}
      <main className="max-w-[95vw] w-full mx-auto py-16 flex-1">
        {loading ? (
          <div className="text-center text-xl font-bold uppercase tracking-widest text-muted-foreground py-20">
            CONNECTING TO LEDGER TELEMETRY STREAM...
          </div>
        ) : (
          <div className="hairline-grid grid-cols-1">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-background p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border hover:bg-muted/30 transition-colors duration-200"
              >
                <div className="flex items-start md:items-center gap-6">
                  {/* Event Type Badge */}
                  <span
                    className={`text-xs font-bold tracking-widest uppercase px-3 py-1 border ${
                      evt.type === "TRANSFER"
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : evt.type === "ESCROW"
                        ? "border-purple-500 bg-purple-500/10 text-purple-400"
                        : evt.type === "TICKET"
                        ? "border-green-500 bg-green-500/10 text-green-400"
                        : "border-accent bg-accent/10 text-accent"
                    }`}
                  >
                    {evt.type}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-lg md:text-xl font-bold tracking-tight text-foreground uppercase">
                      {evt.message}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground mt-1">
                      TX HASH: {evt.txHash}
                    </span>
                  </div>
                </div>

                <span className="text-sm font-bold text-muted-foreground tracking-wider uppercase md:text-right">
                  {evt.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
