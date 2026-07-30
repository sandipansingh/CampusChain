"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ShoppingBag, Coffee, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import {
  useCampusProfile,
  useUniversityProfiles,
} from "@/features/wallet/hooks/useWallet";
import { useMenuItems, usePlaceOrderMutation } from "../hooks";
import { MenuItem } from "../types";

export function StudentOrdering() {
  const { address } = useWallet();
  const { data: profile } = useCampusProfile(address ?? null);
  const myUnivCode = profile?.universityCode ?? "";

  // Queries
  const { data: members = [], isLoading: membersLoading } = useUniversityProfiles(myUnivCode);
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems(address ?? undefined);
  const placeOrder = usePlaceOrderMutation();

  // Local state
  const [selectedMerchantAddress, setSelectedMerchantAddress] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter canteens/food merchants in user's university
  const canteens = members.filter(
    (m) =>
      m.role === 2 &&
      (m.details?.category === "FoodCanteen" ||
        m.details?.category === 2 ||
        String(m.details?.category).toLowerCase() === "foodcanteen")
  );

  const selectedCanteen = canteens.find((c) => c.address === selectedMerchantAddress);

  // Filter menu items for selected canteen
  const canteenItems = menuItems.filter(
    (item) => item.merchant.toLowerCase() === selectedMerchantAddress?.toLowerCase() && item.available
  );

  const handlePlaceOrder = async (item: MenuItem) => {
    if (!address) return;
    setStatusMsg(null);
    const qty = quantities[item.id] ?? 1;
    try {
      await placeOrder.mutateAsync({
        student: address,
        itemId: item.id,
        quantity: qty,
      });
      setStatusMsg({
        type: "success",
        text: `Successfully ordered ${qty}x ${item.name}! Check 'My Orders' to track.`,
      });
      // Reset quantity
      setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to place order.",
      });
    }
  };

  const handleQtyChange = (itemId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  if (membersLoading || menuLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          Campus Canteens
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Order meals and snacks from food canteens inside your university.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-destructive/5 text-destructive border-destructive/20"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Canteens List */}
        <div className="md:col-span-1 bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
            Available Canteens
          </h3>
          {canteens.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">
              No active food canteens verified in your university.
            </p>
          ) : (
            <div className="space-y-1">
              {canteens.map((canteen) => (
                <button
                  key={canteen.address}
                  onClick={() => {
                    setSelectedMerchantAddress(canteen.address);
                    setStatusMsg(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors border cursor-pointer ${
                    selectedMerchantAddress === canteen.address
                      ? "bg-primary/5 border-primary text-foreground"
                      : "bg-transparent border-transparent hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate text-foreground">
                      {canteen.fullName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {String(canteen.details?.businessDescription || "Campus food outlet.")}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Menu List */}
        <div className="md:col-span-2 space-y-4">
          {selectedCanteen ? (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Menu: {selectedCanteen.fullName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {String(selectedCanteen.details?.businessDescription || "Order delicious canteen food.")}
                </p>
              </div>

              {canteenItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  This canteen hasn&apos;t published any menu items yet.
                </p>
              ) : (
                <div className="divide-y divide-border/60">
                  {canteenItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description || "Freshly prepared meal."}
                        </p>
                        <p className="text-xs font-extrabold text-foreground mt-2">
                          {item.priceCamp.toLocaleString()} CAMP
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Qty Selector */}
                        <div className="flex items-center border border-border rounded-lg bg-muted/20">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, -1)}
                            className="h-8 w-8 text-xs font-bold hover:bg-muted rounded-l-lg transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-foreground">
                            {quantities[item.id] ?? 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, 1)}
                            className="h-8 w-8 text-xs font-bold hover:bg-muted rounded-r-lg transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handlePlaceOrder(item)}
                          disabled={placeOrder.isPending}
                          className="h-9 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <ShoppingBag className="size-3.5" /> Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
              <Coffee className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-semibold">Select a canteen from the left</p>
              <p className="text-xs mt-1">Choose an approved food canteen to view their current menu items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentOrdering;
