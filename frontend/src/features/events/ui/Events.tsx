"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  LayoutDashboard,
  Wallet,
  Coins,
  Store,
  Calendar,
  Award,
  GraduationCap,
  Receipt,
  Settings,
  Search,
  CalendarDays,
  Clock,
  MapPin,
  X,
  ExternalLink,
  CalendarX2,
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
    id: "evt1",
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
    id: "evt2",
    title: "Design Portfolio Review",
    organizer: "Design Dept",
    organizerInitials: "DD",
    badge: "Upcoming",
    badgeColorClass: "bg-muted text-foreground",
    date: "Oct 26, 2024",
    timeRange: "2:00 PM - 5:00 PM",
    location: "Studio 4B, Fine Arts",
    priceCamp: "Free",
    capacityText: "48 / 60",
    capacityPercentage: 80,
    description: "Get feedback on your creative portfolio from industry veterans and peers. Open to all design majors and enthusiasts looking to polish their presentation materials for summer internships.",
    categories: ["Design", "Portfolio"],
  },
  {
    id: "evt3",
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
  {
    id: "evt4",
    title: "Blockchain Workshop",
    organizer: "Finance Club",
    organizerInitials: "FC",
    badge: "Upcoming",
    badgeColorClass: "bg-muted text-foreground",
    date: "Nov 05, 2024",
    timeRange: "5:30 PM - 7:30 PM",
    location: "Business Bldg 201",
    priceCamp: "50 CAMP",
    capacityText: "85 / 150",
    capacityPercentage: 56,
    description: "A hands-on coding and business seminar covering Stellar smart contract development, Soroban architecture, university tokenomics models, and campus-wide decentralized service integrations.",
    categories: ["Blockchain", "Finance"],
  },
];

export function Events() {
  const { disconnect } = useWallet();
  const [eventsState, setEventsState] = useState<EventsState>("success");
  const [activeFilter, setActiveFilter] = useState<"all" | "tickets" | "hosting">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);

  // Esc keyboard listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEvent(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: false },
    { label: "Pay (QR)", icon: Coins, href: "#", active: false },
    { label: "Marketplace", icon: Store, href: "#", active: false },
    { label: "Events", icon: Calendar, href: "#", active: true },
    { label: "Rewards", icon: Award, href: "#", active: false },
    { label: "Scholarships", icon: GraduationCap, href: "#", active: false },
    { label: "Transactions", icon: Receipt, href: "#", active: false },
  ];

  const filteredEvents = mockEvents.filter((item) => {
    if (activeFilter === "tickets" && item.id !== "evt1") return false; // mock tickets owned
    if (activeFilter === "hosting" && item.id !== "evt4") return false; // mock hosting list
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
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
            CC
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">University Infrastructure</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  item.active
                    ? "bg-secondary text-secondary-foreground font-bold border-r-4 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
        
        {/* 2. Top Navbar */}
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold">Campus Events</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-9 pr-4 py-1.5 bg-muted/40 border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<EventsState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={eventsState}
                onChange={(val) => setEventsState(val)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold select-none cursor-pointer">
                JD
              </div>
              <button
                onClick={disconnect}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative h-full">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* MOBILE ONLY: Top Header */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Events</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<EventsState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={eventsState}
                    onChange={(val) => setEventsState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  JD
                </div>
              </div>
            </div>

            {/* MOBILE ONLY Search bar */}
            <div className="relative w-full md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
              />
            </div>

            {/* Filter buttons row */}
            <div className="flex items-center gap-2 border-b border-border pb-3 shrink-0 overflow-x-auto hide-scrollbar">
              {[
                { value: "all", label: "All Events" },
                { value: "tickets", label: "My Tickets" },
                { value: "hosting", label: "Hosting" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value as "all" | "tickets" | "hosting")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                    activeFilter === filter.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Events Grid */}
            {eventsState === "loading" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : eventsState === "empty" || filteredEvents.length === 0 ? (
              <div className="p-16 border border-border rounded-xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <CalendarX2 className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-md font-bold">No Events Found</h3>
                <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                  There are no scheduled events matching your selected filters or search parameters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => setSelectedEvent(item)}
                    className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 hover:border-foreground/45 transition-all duration-200 cursor-pointer shadow-sm group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-foreground">
                        <CalendarDays className="h-6 w-6" />
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.badgeColorClass}`}>
                        {item.badge}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">{item.organizer}</p>
                    </div>

                    <div className="space-y-2 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{item.date} • {item.timeRange.split(" - ")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.location.split(", ")[0]}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{item.priceCamp}</span>
                      <button
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all active:scale-[0.98] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(item);
                        }}
                      >
                        Register
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* 3. Event Details Modal dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <div
            onClick={() => setSelectedEvent(null)}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Modal content sheet */}
          <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Minimal SVG visual header block */}
            <div className="relative h-44 bg-zinc-900 flex items-center justify-center shrink-0">
              <CalendarDays className="h-16 w-16 text-zinc-500 opacity-60" />
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  {selectedEvent.categories.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      {c}
                    </span>
                  ))}
                </div>

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

              <hr className="border-border" />

              {/* Organizer details */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                    Organized by
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-secondary-foreground select-none">
                      {selectedEvent.organizerInitials}
                    </div>
                    <span className="text-xs font-bold">{selectedEvent.organizer}</span>
                  </div>
                </div>
                
                <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <ExternalLink className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  About this event
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed text-justify">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Progress capacity */}
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
                <p className="text-[10px] text-muted-foreground text-right mt-1.5 font-bold">
                  {selectedEvent.capacityPercentage > 90 ? "Selling fast!" : "Spaces available"}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                  Registration Fee
                </span>
                <span className="text-base font-black text-foreground">{selectedEvent.priceCamp}</span>
              </div>

              <button className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-primary/95 transition-all active:scale-[0.99] cursor-pointer">
                Register & Pay
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-45 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Dashboard", icon: LayoutDashboard, active: false },
          { label: "Wallet", icon: Wallet, active: false },
          { label: "Pay", icon: Coins, active: false },
          { label: "Market", icon: Store, active: false },
          { label: "Events", icon: Calendar, active: true },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex flex-col items-center justify-center w-16 py-2.5 transition-all cursor-pointer ${
                item.active ? "text-foreground font-bold scale-105" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
export default Events;
