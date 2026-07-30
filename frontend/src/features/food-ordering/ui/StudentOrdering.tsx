"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  ShoppingBag,
  Coffee,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ShoppingCart,
  Wallet
} from "lucide-react";
import {
  useCampusProfile,
  useUniversityProfiles,
} from "@/features/wallet/hooks/useWallet";
import { useMenuItems, usePlaceOrderMutation } from "../hooks";
import { MenuItem } from "../types";

interface CartItem {
  item: MenuItem;
  quantity: number;
}

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkoutProgress, setCheckoutProgress] = useState<string | null>(null);

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

  // Quantity picker on menu card
  const handleQtyChange = (itemId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    const qty = quantities[item.id] ?? 1;
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { item, quantity: qty }];
    });
    // Reset quantity input state back to 1
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    setStatusMsg(null);
  };

  const handleUpdateCartQty = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            return { ...c, quantity: c.quantity + delta };
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleCheckout = async () => {
    if (!address || cart.length === 0) return;
    setStatusMsg(null);
    setCheckoutProgress("Initiating checkout...");

    try {
      // Process sequential order placements
      for (let i = 0; i < cart.length; i++) {
        const cartItem = cart[i];
        setCheckoutProgress(
          `Submitting order ${i + 1}/${cart.length}: ${cartItem.quantity}x ${cartItem.item.name}...`
        );
        await placeOrder.mutateAsync({
          student: address,
          itemId: cartItem.item.id,
          quantity: cartItem.quantity,
        });
      }

      setStatusMsg({
        type: "success",
        text: "Orders placed and paid successfully! Track them in 'My Orders'.",
      });
      setCart([]);
    } catch (err) {
      console.error("Checkout failed", err);
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Checkout transaction failed.",
      });
    } finally {
      setCheckoutProgress(null);
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, c) => sum + c.item.priceCamp * c.quantity, 0);
  const networkFee = cart.length > 0 ? 1 : 0;
  const total = subtotal + networkFee;

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
    <div className="flex flex-col lg:flex-row gap-6 h-full items-stretch min-h-[calc(100vh-10rem)]">
      
      {/* Left/Middle Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-w-0">
        
        {/* Column 1: Canteens List */}
        <div className="w-full md:w-64 bg-card border border-border rounded-xl p-4 shadow-sm space-y-3 shrink-0">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
            Campus Outlets
          </h3>
          {canteens.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">
              No active food canteens verified at your university.
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
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all border cursor-pointer ${
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

        {/* Column 2: Selected Canteen Menu */}
        <div className="flex-1 min-w-0">
          {selectedCanteen ? (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full">
              {/* Canteen Header */}
              <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      Open Now
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{selectedCanteen.fullName}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {String(selectedCanteen.details?.businessDescription || "Order delicious canteen food.")}
                  </p>
                </div>
              </div>

              {statusMsg && (
                <div
                  className={`p-3 mb-4 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
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

              {canteenItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <Coffee className="size-8 opacity-40 mb-2" />
                  <p className="text-sm font-semibold">No offerings found</p>
                  <p className="text-xs">This canteen hasn&apos;t published any available menu items yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {canteenItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                          <Coffee className="size-5 text-muted-foreground" />
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-foreground">{item.priceCamp.toLocaleString()} CAMP</div>
                          <div className="text-[10px] text-muted-foreground font-medium mt-0.5">≈ {(item.priceCamp / 10).toFixed(1)} XLM</div>
                        </div>
                      </div>

                      <div className="mb-4 flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {item.description || "Fresh campus food outlet item."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-auto">
                        {/* Stepper */}
                        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-foreground">
                            {quantities[item.id] ?? 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAddToCart(item)}
                          className="bg-transparent border border-primary text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          Add <ShoppingBag className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[300px]">
              <Coffee className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-semibold">Select a Canteen</p>
              <p className="text-xs mt-1 max-w-xs">
                Select an approved campus canteen from the list to explore their menu options.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Current Order Shopping Cart */}
      <div className="w-full lg:w-[380px] bg-card border border-border rounded-xl shadow-sm flex flex-col shrink-0 overflow-hidden relative">
        <div className="p-6 border-b border-border bg-card">
          <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <ShoppingCart className="size-5" /> Current Order
          </h2>
          {selectedCanteen && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {selectedCanteen.fullName}
              </p>
            </div>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-card max-h-[350px]">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ShoppingCart className="size-8 mb-2 opacity-30" />
              <p className="text-xs font-semibold">Your cart is empty.</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Add menu offerings to build your meal order.
              </p>
            </div>
          ) : (
            cart.map((cartItem) => (
              <div key={cartItem.item.id} className="flex justify-between items-start group">
                <div className="flex gap-3 min-w-0">
                  <div className="w-6 h-6 border border-border rounded bg-muted/30 flex items-center justify-center text-xs font-bold text-foreground mt-0.5 shrink-0">
                    {cartItem.quantity}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-foreground truncate">{cartItem.item.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => handleUpdateCartQty(cartItem.item.id, -1)}
                        className="text-[10px] text-muted-foreground underline hover:text-foreground transition-colors cursor-pointer"
                      >
                        Reduce
                      </button>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <button
                        onClick={() => handleRemoveFromCart(cartItem.item.id)}
                        className="text-[10px] text-red-600 underline hover:text-red-700 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-xs text-foreground">{(cartItem.item.priceCamp * cartItem.quantity).toLocaleString()}</div>
                  <div className="text-[9px] text-muted-foreground font-semibold uppercase">CAMP</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout panel */}
        <div className="p-6 border-t border-border bg-muted/10 relative">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-2 font-medium">
            <span>Subtotal</span>
            <span className="text-foreground">{subtotal.toLocaleString()} CAMP</span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-4 font-medium">
            <span>Network Fee</span>
            <span className="text-foreground">{networkFee.toLocaleString()} CAMP</span>
          </div>
          <div className="h-px w-full bg-border mb-4"></div>
          
          <div className="flex justify-between items-end mb-6">
            <span className="text-sm font-bold text-foreground">Total</span>
            <div className="text-right">
              <div className="text-lg font-black text-foreground tracking-tight">{total.toLocaleString()} CAMP</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">≈ {(total / 10).toFixed(1)} XLM</div>
            </div>
          </div>

          {checkoutProgress ? (
            <div className="w-full bg-muted border border-border p-3 rounded-xl flex flex-col items-center justify-center text-center gap-2">
              <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-foreground animate-pulse">{checkoutProgress}</p>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || placeOrder.isPending}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:opacity-90 transition-all active:scale-[0.98] duration-150 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Wallet className="size-4" /> Place Order & Pay
            </button>
          )}

          <p className="text-center text-[9px] text-muted-foreground mt-3 font-semibold uppercase tracking-wider">
            Secured by Stellar Network
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentOrdering;
