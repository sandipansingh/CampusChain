import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";

export async function fetchEvent(eventId: number, address?: string) {
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_event",
    [u64ToScVal(eventId)],
    address
  )) as unknown as { id: bigint; host: string; price: bigint; capacity: number; tickets_sold: number };

  if (!res) return null;
  return {
    id: Number(res.id),
    host: String(res.host),
    price: Number(res.price) / 10_000_000,
    capacity: Number(res.capacity),
    tickets_sold: Number(res.tickets_sold),
  };
}

export async function fetchTicket(ticketId: number, address?: string) {
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_ticket",
    [u64ToScVal(ticketId)],
    address
  )) as unknown as { id: bigint; event_id: bigint; owner: string; redeemed: boolean };

  if (!res) return null;
  return {
    id: Number(res.id),
    event_id: Number(res.event_id),
    owner: String(res.owner),
    redeemed: Boolean(res.redeemed),
  };
}

export async function executeCreateEvent(host: string, price: number, capacity: number): Promise<string> {
  const rawPrice = BigInt(Math.round(price * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "create_event",
    [addressToScVal(host), i128ToScVal(rawPrice), u32ToScVal(capacity)],
    host,
    signTx
  );
}

export async function executeBuyTicket(eventId: number, buyer: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "buy_ticket",
    [u64ToScVal(eventId), addressToScVal(buyer)],
    buyer,
    signTx
  );
}

export async function executeRedeemTicket(ticketId: number, host: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "redeem_ticket",
    [u64ToScVal(ticketId), addressToScVal(host)],
    host,
    signTx
  );
}
