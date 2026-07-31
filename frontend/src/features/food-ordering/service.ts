import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  u32ToScVal,
  u64ToScVal,
  stringToScVal,
  i128ToScVal,
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  getEventsSafe,
} from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import { MenuItem, FoodOrder, FoodOrderStatus } from "./types";
import { scValToNative, nativeToScVal } from "@stellar/stellar-sdk";

export async function fetchMenuItem(itemId: number, address?: string): Promise<MenuItem | null> {
  try {
    const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
    const res = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_menu_item",
      [u64ToScVal(itemId), addressToScVal(caller)],
      address
    ) as Record<string, unknown>;

    if (!res) return null;
    return {
      id: Number(res.id ?? itemId),
      merchant: String(res.merchant ?? ""),
      universityCode: String(res.university_code ?? ""),
      name: String(res.name ?? ""),
      description: String(res.description ?? ""),
      priceCamp: Number(res.price_camp ?? 0) / 10_000_000,
      available: Boolean(res.available),
      createdAt: Number(res.created_at ?? 0),
      updatedAt: Number(res.updated_at ?? 0),
    };
  } catch (error) {
    console.warn(`Failed to fetch menu item #${itemId}`, error);
    return null;
  }
}

export async function fetchMenuItems(address?: string): Promise<MenuItem[]> {
  try {
    const server = getRpcServer();
    const latest = await server.getLatestLedger();
    const startLedger = Math.max(1, latest.sequence - 10000);

    const res = (await getEventsSafe(server, {
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID],
        },
      ],
      limit: 100,
    })) as { events: { topic: unknown[]; value: unknown }[] };

    const itemIds = new Set<number>();
    for (const evt of res.events) {
      try {
        const topics = evt.topic.map((t: unknown) => scValToNative(t as never)) as unknown[];
        if (topics[0] === "MenuItemPublished") {
          itemIds.add(Number(topics[1]));
        }
      } catch {
        // ignore
      }
    }

    const items: MenuItem[] = [];
    for (const id of itemIds) {
      const item = await fetchMenuItem(id, address);
      if (item) items.push(item);
    }
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("fetchMenuItems failed", error);
    return [];
  }
}

export async function fetchFoodOrder(orderId: number, address?: string): Promise<FoodOrder | null> {
  try {
    const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
    const res = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_food_order",
      [u64ToScVal(orderId), addressToScVal(caller)],
      address
    ) as Record<string, unknown>;

    if (!res) return null;
    const unitPrice = Number(res.unit_price_camp ?? 0) / 10_000_000;
    const totalPrice = Number(res.total_camp ?? 0) / 10_000_000;

    let status: FoodOrderStatus = FoodOrderStatus.Placed;
    if (res.status && typeof res.status === "object" && "name" in res.status) {
      const statusName = String((res.status as { name: unknown }).name);
      const mapping: Record<string, FoodOrderStatus> = {
        Placed: FoodOrderStatus.Placed,
        Preparing: FoodOrderStatus.Preparing,
        ReadyForPickup: FoodOrderStatus.ReadyForPickup,
        Completed: FoodOrderStatus.Completed,
        Cancelled: FoodOrderStatus.Cancelled,
      };
      status = mapping[statusName] ?? FoodOrderStatus.Placed;
    } else if (typeof res.status === "number") {
      status = res.status as FoodOrderStatus;
    }

    let menuItemName = "";
    try {
      const item = await fetchMenuItem(Number(res.menu_item_id), address);
      if (item) menuItemName = item.name;
    } catch {
      // ignore
    }

    return {
      id: Number(res.id ?? orderId),
      merchant: String(res.merchant ?? ""),
      student: String(res.student ?? ""),
      universityCode: String(res.university_code ?? ""),
      menuItemId: Number(res.menu_item_id ?? 0),
      quantity: Number(res.quantity ?? 0),
      unitPriceCamp: unitPrice,
      totalCamp: totalPrice,
      status,
      placedAt: Number(res.placed_at ?? 0),
      updatedAt: Number(res.updated_at ?? 0),
      menuItemName,
    };
  } catch (error) {
    console.warn(`Failed to fetch order #${orderId}`, error);
    return null;
  }
}

export async function fetchFoodOrders(address?: string): Promise<FoodOrder[]> {
  try {
    const server = getRpcServer();
    const latest = await server.getLatestLedger();
    const startLedger = Math.max(1, latest.sequence - 10000);

    const res = (await getEventsSafe(server, {
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID],
        },
      ],
      limit: 100,
    })) as { events: { topic: unknown[]; value: unknown }[] };

    const orderIds = new Set<number>();
    for (const evt of res.events) {
      try {
        const topics = evt.topic.map((t: unknown) => scValToNative(t as never)) as unknown[];
        if (topics[0] === "OrderPlaced") {
          orderIds.add(Number(topics[1]));
        }
      } catch {
        // ignore
      }
    }

    const orders: FoodOrder[] = [];
    for (const id of orderIds) {
      const order = await fetchFoodOrder(id, address);
      if (order) {
        if (address) {
          if (
            order.student.toLowerCase() === address.toLowerCase() ||
            order.merchant.toLowerCase() === address.toLowerCase()
          ) {
            orders.push(order);
          }
        } else {
          orders.push(order);
        }
      }
    }
    return orders.sort((a, b) => b.placedAt - a.placedAt);
  } catch (error) {
    console.error("fetchFoodOrders failed", error);
    return [];
  }
}

export async function executePublishMenuItem(
  merchant: string,
  name: string,
  description: string,
  priceCamp: number,
  available: boolean
): Promise<string> {
  const priceRaw = BigInt(Math.round(priceCamp * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "publish_menu_item",
    [
      addressToScVal(merchant),
      stringToScVal(name),
      stringToScVal(description),
      i128ToScVal(priceRaw),
      nativeToScVal(available),
    ],
    merchant,
    signTx
  );
}

export async function executeUpdateMenuItem(
  merchant: string,
  itemId: number,
  name: string,
  description: string,
  priceCamp: number,
  available: boolean
): Promise<string> {
  const priceRaw = BigInt(Math.round(priceCamp * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "update_menu_item",
    [
      addressToScVal(merchant),
      u64ToScVal(itemId),
      stringToScVal(name),
      stringToScVal(description),
      i128ToScVal(priceRaw),
      nativeToScVal(available),
    ],
    merchant,
    signTx
  );
}

export async function executePlaceOrder(
  student: string,
  itemId: number,
  quantity: number
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "place_order",
    [
      addressToScVal(student),
      u64ToScVal(itemId),
      u32ToScVal(quantity),
    ],
    student,
    signTx
  );
}

export async function executeUpdateOrderStatus(
  merchant: string,
  orderId: number,
  newStatus: FoodOrderStatus
): Promise<string> {
  const statusName = ["Placed", "Preparing", "ReadyForPickup", "Completed", "Cancelled"][newStatus - 1];
  const nativeToScValSymbol = (await import("@stellar/stellar-sdk")).nativeToScVal;
  const statusScVal = nativeToScValSymbol(statusName, { type: "symbol" });

  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "update_order_status",
    [
      addressToScVal(merchant),
      u64ToScVal(orderId),
      statusScVal,
    ],
    merchant,
    signTx
  );
}

export async function executeCancelOrder(
  caller: string,
  orderId: number
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "cancel_order",
    [
      addressToScVal(caller),
      u64ToScVal(orderId),
    ],
    caller,
    signTx
  );
}
