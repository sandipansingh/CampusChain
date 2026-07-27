"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBuyTicketMutation, useCreateEventMutation } from "@/features/events/hooks/useEvents";
import { useApproveMutation } from "@/features/wallet/hooks/useWallet";
import { NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID } from "@/shared/stellar/client";
import {
  CalendarDays,
  Clock,
  MapPin,
  X,
  ExternalLink,
  CalendarX2,
  Search,
} from "lucide-react";

type EventsState = "success" | "loading" | "empty";

interface CampusEvent {
  id: string;
  title: string;
  organizer: string;
  organizerInitials: string;
  badge: "Upcoming" | "Almost Full" | "Past";
  badgeColorClass: string;
  date: string;
  timeRange: string;
  location: string;
  priceCamp: string;
  capacityText: string;
  capacityPercentage: number;
  description: string;
  categories: string[];
}

const mockEvents: CampusEvent[] = [
  {
    id: "1",
    title: "Tech Symposium '24",
    organizer: "CS Student Association",
    organizerInitials: "CS",
    badge: "Upcoming",
    badgeColorClass: "bg-primary text-primary-foreground",
    date: "Oct 24, 2024",
    timeRange: "10:00 AM - 4:00 PM",
    location: "Main Auditorium, Building C",
    priceCamp: "150 CAMP",
    capacityText: "320 / 400",
    capacityPercentage: 80,
    description: "Join us for the annual Tech Symposium featuring keynote speakers from top tech firms, interactive workshops, and networking opportunities. This year's focus is on decentralized systems and the future of campus infrastructure.",
    categories: ["Technology", "Symposium"],
  },
  {
    id: "2",
    title: "Design Portfolio Review",
    organizer: "Design Dept",
    organizerInitials: "DD",
    badge: "Upcoming",
    badgeColorClass: "bg-muted text-foreground",
    date: "Oct 26, 2024",
    timeRange: "2:00 PM - 5:00 PM",
    location: "Studio 4B, Fine Arts",
    priceCamp: "0 CAMP",
    capacityText: "48 / 60",
    capacityPercentage: 80,
    description: "Get feedback on your creative portfolio from industry veterans and peers. Open to all design majors and enthusiasts looking to polish their presentation materials for summer internships.",
    categories: ["Design", "Portfolio"],
  },
  {
    id: "3",
    title: "Fall Concert Series",
    organizer: "Student Union Board",
    organizerInitials: "SU",
    badge: "Almost Full",
    badgeColorClass: "bg-secondary text-secondary-foreground border border-border animate-pulse",
    date: "Nov 02, 2024",
    timeRange: "8:00 PM - 11:00 PM",
    location: "Campus Quad Outdoors",
    priceCamp: "250 CAMP",
    capacityText: "490 / 500",
    capacityPercentage: 98,
    description: "Our signature annual fall music festival featuring student bands and special guests. Grab your tickets early before the contract registry caps out. Free snacks and refreshments included.",
    categories: ["Music", "Concert"],
  },
];

export function Events() {
  const { address } = useWallet();
  const [eventsState, setEventsState] = useState<EventsState>("success");
  const [activeFilter, setActiveFilter] = useState<"all" | "tickets" | "hosting">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  
  // Checkout flow states
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);

  const approveMutation = useApproveMutation();
  const buyTicketMutation = useBuyTicketMutation();

  const handleRegisterAndPay = async (event: CampusEvent) => {
    if (!address) {
      setStatusMsg({ type: "error", text: "Please connect your wallet first." });
      return;
    }
    
    setIsCheckoutPending(true);
    const priceNum = parseFloat(event.priceCamp);

    try {
      if (priceNum > 0) {
        setStatusMsg({ type: "info", text: "Step 1/2: Approving CAMP token spending allowance..." });
        await approveMutation.mutateAsync({
          from: address,
          spender: NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          amount: priceNum,
        });
      }

      setStatusMsg({ type: "info", text: "Step 2/2: Ordering on-chain ticket..." });
      await buyTicketMutation.mutateAsync({
        eventId: Number(event.id),
        buyer: address,
      });

      setStatusMsg({ type: "success", text: "Ticket registration successful! Ticket confirmed." });
      setTimeout(() => {
        setSelectedEvent(null);
        setStatusMsg(null);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: "error", text: `Registration failed: ${msg}` });
    } finally {
      setIsCheckoutPending(false);
    }
  };

  const filteredEvents = mockEvents.filter((item) => {
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.organizer.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
          />
        </div>

        <div className="w-40">
          <Dropdown<EventsState>
            options={[
              { value: "success", label: "State: Loaded" },
              { value: "loading", label: "State: Loading" },
              { value: "empty", label: "State: Empty" },
            ]}
            value={eventsState}
            onChange={(val) => setEventsState(val)}
          />
        </div>
      </div>

      {/* Grid listing */}
      {eventsState === "loading" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full rounded" />
            </div>
          ))}
        </div>
      ) : eventsState === "empty" || filteredEvents.length === 0 ? (
        <div className="p-16 text-center bg-card border border-border rounded-xl flex flex-col items-center justify-center gap-3">
          <CalendarX2 className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">No events found</h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            There are no upcoming activities registered.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((evt) => (
            <article
              key={evt.id}
              onClick={() => {
                setSelectedEvent(evt);
                setStatusMsg(null);
              }}
              className="bg-card border border-border rounded-xl p-5 hover:border-foreground hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${evt.badgeColorClass}`}>
                    {evt.badge}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-foreground">{evt.priceCamp}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors mb-2">
                  {evt.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {evt.description}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-[10px]">
                    {evt.organizerInitials}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{evt.organizer}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{evt.date}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Details modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isCheckoutPending && setSelectedEvent(null)}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-44 bg-zinc-900 flex items-center justify-center shrink-0">
              <CalendarDays className="h-16 w-16 text-zinc-500 opacity-60" />
              <button
                onClick={() => !isCheckoutPending && setSelectedEvent(null)}
                disabled={isCheckoutPending}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {statusMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold border ${
                  statusMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : statusMsg.type === "error"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
                }`}>
                  {statusMsg.text}
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold leading-tight">{selectedEvent.title}</h2>
                <div className="flex flex-col sm:flex-row gap-3 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{selectedEvent.date} • {selectedEvent.timeRange}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  About this event
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed text-justify">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-foreground">Capacity Registration</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {selectedEvent.capacityText}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${selectedEvent.capacityPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                  Registration Fee
                </span>
                <span className="text-base font-black text-foreground">{selectedEvent.priceCamp}</span>
              </div>

              <button
                onClick={() => handleRegisterAndPay(selectedEvent)}
                disabled={isCheckoutPending}
                className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-primary/95 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckoutPending ? "Processing..." : "Register & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Events;
