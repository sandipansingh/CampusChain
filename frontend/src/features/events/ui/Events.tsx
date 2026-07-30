"use client";

import { useState } from "react";
import { CalendarX2, Lock, Search, Users } from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useWallet } from "@/shared/stellar/useWallet";
import { NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID } from "@/shared/stellar/client";
import { useApproveMutation } from "@/features/wallet/hooks/useWallet";
import { useBuyTicketMutation, useEvents } from "@/features/events/hooks/useEvents";

export function Events() {
  const { address } = useWallet();
  const { data: events = [], isLoading, isError, error, refetch } = useEvents(address ?? undefined);
  const [query, setQuery] = useState("");
  const approve = useApproveMutation();
  const buyTicket = useBuyTicketMutation();
  const [notice, setNotice] = useState<string | null>(null);
  const filtered = events.filter((event) => `event ${event.id} ${event.host}`.toLowerCase().includes(query.toLowerCase().trim()));
  const purchase = async (event: typeof events[number]) => {
    if (!address) return;
    setNotice(null);
    try {
      if (event.price > 0) await approve.mutateAsync({ from: address, spender: NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, amount: event.price });
      const hash = await buyTicket.mutateAsync({ eventId: event.id, buyer: address });
      setNotice(`Ticket confirmed: ${hash}`);
      await refetch();
    } catch (purchaseError) { setNotice(purchaseError instanceof Error ? purchaseError.message : "Ticket purchase failed."); }
  };
  return <div className="w-full space-y-6"><div className="flex flex-col md:flex-row gap-4 justify-between"><label className="relative w-full md:w-80"><span className="sr-only">Search events</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search event ID or host address" className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground" /></label></div>{notice && <p className={notice.startsWith("Ticket confirmed") ? "text-xs text-emerald-700 break-all" : "text-xs text-destructive break-words"}>{notice}</p>}
    {isLoading ? <div className="grid md:grid-cols-2 gap-6">{[1, 2].map((id) => <div key={id} className="bg-card border border-border rounded-xl p-5 space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-full" /></div>)}</div> : isError ? <div className="p-6 bg-card border border-destructive/30 rounded-xl"><p className="font-bold">Could not read on-chain events.</p><p className="mt-1 text-xs text-muted-foreground break-words">{error instanceof Error ? error.message : "Unknown error"}</p><button onClick={() => refetch()} className="mt-3 text-xs font-bold underline">Retry</button></div> : filtered.length === 0 ? <div className="p-16 text-center bg-card border border-border rounded-xl"><CalendarX2 className="h-10 w-10 text-muted-foreground mx-auto" /><h3 className="mt-3 text-base font-bold">No events found</h3><p className="mt-1 text-xs text-muted-foreground">No on-chain events match this search.</p></div> : <div className="grid md:grid-cols-2 gap-6">{filtered.map((event) => <article key={event.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5"><div><div className="flex justify-between gap-3"><h3 className="text-base font-bold">Event #{event.id}</h3><p className="font-bold shrink-0">{event.price.toLocaleString()} CAMP</p></div><p className="mt-3 text-xs text-muted-foreground font-mono truncate" title={event.host}>Host: {event.host}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{event.tickets_sold} / {event.capacity} tickets</p></div><button onClick={() => purchase(event)} disabled={!address || event.tickets_sold >= event.capacity || approve.isPending || buyTicket.isPending} className="h-10 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"><Lock className="h-3.5 w-3.5" />{event.tickets_sold >= event.capacity ? "Sold out" : approve.isPending || buyTicket.isPending ? "Confirming ticket" : "Buy ticket"}</button></article>)}</div>}</div>;
}
export default Events;
