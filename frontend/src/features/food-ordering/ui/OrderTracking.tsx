"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  ClipboardList,
  XCircle,
  ArrowRight,
  Clock,
  User,
  Check,
  MapPin,
  HelpCircle,
  Store
} from "lucide-react";
import {
  useFoodOrders,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} from "../hooks";
import { FoodOrder, FoodOrderStatus, FoodOrderStatusLabels } from "../types";

interface OrderTrackingProps {
  isMerchant?: boolean;
}

export function OrderTracking({ isMerchant = false }: OrderTrackingProps) {
  const { address } = useWallet();
  const ordersQuery = useFoodOrders(address ?? undefined);
  const updateStatus = useUpdateOrderStatusMutation();
  const cancelOrder = useCancelOrderMutation();

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | number | null>(null);

  const orders = ordersQuery.data ?? [];
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleAdvanceStatus = async (order: FoodOrder) => {
    if (!address) return;
    setActionError(null);
    setActioningId(`status-${order.id}`);
    
    let nextStatus: FoodOrderStatus;
    if (order.status === FoodOrderStatus.Placed) {
      nextStatus = FoodOrderStatus.Preparing;
    } else if (order.status === FoodOrderStatus.Preparing) {
      nextStatus = FoodOrderStatus.ReadyForPickup;
    } else if (order.status === FoodOrderStatus.ReadyForPickup) {
      nextStatus = FoodOrderStatus.Completed;
    } else {
      return;
    }

    try {
      await updateStatus.mutateAsync({
        merchant: address,
        orderId: order.id,
        newStatus: nextStatus,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to advance order status.");
    } finally {
      setActioningId(null);
    }
  };

  const handleCancelOrder = async (order: FoodOrder) => {
    if (!address) return;
    if (!confirm("Are you sure you want to cancel and refund this order?")) return;
    setActionError(null);
    setActioningId(`cancel-${order.id}`);
    try {
      await cancelOrder.mutateAsync({
        caller: address,
        orderId: order.id,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setActioningId(null);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getStatusColor = (status: FoodOrderStatus) => {
    switch (status) {
      case FoodOrderStatus.Placed:
        return "bg-muted text-muted-foreground border border-border";
      case FoodOrderStatus.Preparing:
        return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case FoodOrderStatus.ReadyForPickup:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case FoodOrderStatus.Completed:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case FoodOrderStatus.Cancelled:
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Convert placing time to human format
  const getPlacingTime = (timestamp: number) => {
    if (!timestamp) return "Recently";
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          {isMerchant ? "Incoming & Active Orders" : "My Food Orders"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isMerchant
            ? "Manage, prepare, and advance canteen orders placed by students."
            : "Track the preparation and pickup status of your canteen orders live."}
        </p>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg border text-xs font-semibold bg-destructive/5 text-destructive border-destructive/20 flex items-center gap-2">
          <XCircle className="size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid: Orders list left, Detail right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Orders List (3/12 width) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl p-4 shadow-sm space-y-3 flex flex-col h-full min-h-[450px]">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
            Orders Queue
          </h3>

          {ordersQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ClipboardList className="size-8 opacity-40 mb-2" />
              <p className="text-xs font-semibold">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setSelectedOrderId(o.id);
                    setActionError(null);
                  }}
                  className={`w-full text-left p-3 border rounded-lg flex flex-col gap-2 transition-all cursor-pointer ${
                    selectedOrderId === o.id
                      ? "bg-primary/5 border-primary text-foreground"
                      : "bg-transparent border-transparent hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-foreground">Order #{o.id}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                      <Clock className="size-3" />
                      {getPlacingTime(o.placedAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-end w-full">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {o.quantity}x {o.menuItemName || `Item #${o.menuItemId}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Total: {o.totalCamp.toLocaleString()} CAMP
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold border px-1.5 py-0.5 rounded shrink-0 ${getStatusColor(
                        o.status
                      )}`}
                    >
                      {FoodOrderStatusLabels[o.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Status Tracker (8/12 width) */}
        <div className="lg:col-span-8 flex flex-col">
          {selectedOrder ? (
            <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden h-full min-h-[450px]">
              
              {/* Card Title Details */}
              <div className="p-6 border-b border-border bg-card flex flex-col sm:flex-row justify-between sm:items-end gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">Order #{selectedOrder.id}</h2>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <User className="size-3.5" />
                    {isMerchant ? (
                      <>
                        Student: <span className="font-mono font-semibold">{formatAddress(selectedOrder.student)}</span>
                      </>
                    ) : (
                      <>
                        Canteen: <span className="font-mono font-semibold">{formatAddress(selectedOrder.merchant)}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="bg-muted rounded-full px-3 py-1 flex items-center gap-1.5 border border-border inline-flex">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[10px] font-bold text-foreground">{FoodOrderStatusLabels[selectedOrder.status]}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(selectedOrder.placedAt * 1000).toLocaleString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Responsive details: Stepper left, receipt details right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 flex-1 overflow-y-auto max-h-[350px]">
                
                {/* Stepper Column (4/12) */}
                <div className="md:col-span-5 bg-muted/10 border border-border rounded-xl p-5 h-fit">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Status Timeline</h3>
                  
                  {selectedOrder.status === FoodOrderStatus.Cancelled ? (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <XCircle className="size-4 shrink-0" />
                      <span>This order was cancelled and CAMP refunded.</span>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Vertical connector line */}
                      <div className="absolute left-[11px] top-4 bottom-8 w-[2px] bg-border/60 -z-0"></div>
                      
                      {/* Vertical line fill for status progress */}
                      <div
                        className="absolute left-[11px] top-4 w-[2px] bg-primary -z-0 transition-all duration-500"
                        style={{
                          height: `${
                            selectedOrder.status === FoodOrderStatus.Completed
                              ? 100
                              : selectedOrder.status === FoodOrderStatus.ReadyForPickup
                              ? 66
                              : selectedOrder.status === FoodOrderStatus.Preparing
                              ? 33
                              : 0
                          }%`,
                        }}
                      />

                      <div className="flex flex-col gap-5">
                        {/* Step 1: Placed */}
                        <div className="flex gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                            selectedOrder.status >= FoodOrderStatus.Placed ? "bg-primary" : "bg-muted border-2 border-border text-muted-foreground"
                          }`}>
                            {selectedOrder.status >= FoodOrderStatus.Placed ? <Check className="size-3.5" /> : "1"}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${selectedOrder.status >= FoodOrderStatus.Placed ? "text-foreground" : "text-muted-foreground"}`}>Placed</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Payment confirmed.</p>
                          </div>
                        </div>

                        {/* Step 2: Preparing */}
                        <div className="flex gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                            selectedOrder.status >= FoodOrderStatus.Preparing ? "bg-primary" : "bg-muted border-2 border-border text-muted-foreground"
                          } ${selectedOrder.status === FoodOrderStatus.Preparing ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}>
                            {selectedOrder.status >= FoodOrderStatus.Preparing ? <Check className="size-3.5" /> : "2"}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${selectedOrder.status >= FoodOrderStatus.Preparing ? "text-foreground" : "text-muted-foreground"}`}>Preparing</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Kitchen is cooking.</p>
                          </div>
                        </div>

                        {/* Step 3: Ready for Pickup */}
                        <div className="flex gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                            selectedOrder.status >= FoodOrderStatus.ReadyForPickup ? "bg-primary" : "bg-muted border-2 border-border text-muted-foreground"
                          } ${selectedOrder.status === FoodOrderStatus.ReadyForPickup ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}>
                            {selectedOrder.status >= FoodOrderStatus.ReadyForPickup ? <Check className="size-3.5" /> : "3"}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${selectedOrder.status >= FoodOrderStatus.ReadyForPickup ? "text-foreground" : "text-muted-foreground"}`}>Ready for Pickup</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Collect at counter.</p>
                          </div>
                        </div>

                        {/* Step 4: Completed */}
                        <div className="flex gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                            selectedOrder.status >= FoodOrderStatus.Completed ? "bg-primary" : "bg-muted border-2 border-border text-muted-foreground"
                          }`}>
                            {selectedOrder.status >= FoodOrderStatus.Completed ? <Check className="size-3.5" /> : "4"}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${selectedOrder.status >= FoodOrderStatus.Completed ? "text-foreground" : "text-muted-foreground"}`}>Completed</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Handed over.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Column (7/12) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Map Header Placeholder */}
                  <div className="h-28 bg-muted/40 rounded-xl relative overflow-hidden flex flex-col justify-center items-center border border-border border-dashed">
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }} />
                    <Store className="size-7 text-primary mb-1" />
                    <span className="text-[11px] font-bold text-foreground tracking-tight">Main Campus Food Center</span>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 bg-muted/20 border border-border/80 rounded-xl flex gap-3">
                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground">Pickup Location</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Collect at Window 2. Have order number ready.</p>
                    </div>
                  </div>

                  {/* Items list card */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Order Receipt</h4>
                    
                    <div className="flex justify-between items-start py-2 border-b border-border/40 text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[200px]">
                        {selectedOrder.quantity}x {selectedOrder.menuItemName || `Menu Item #${selectedOrder.menuItemId}`}
                      </span>
                      <span className="font-bold text-foreground">{selectedOrder.totalCamp.toLocaleString()} CAMP</span>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-3 text-[10px] text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{selectedOrder.totalCamp.toLocaleString()} CAMP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network Fee</span>
                        <span>1 CAMP</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border/40 text-xs font-bold text-foreground">
                        <span>Total Paid</span>
                        <span>{(selectedOrder.totalCamp + 1).toLocaleString()} CAMP</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-border flex justify-end gap-2 bg-card">
                {/* Cancel Button */}
                {((isMerchant && selectedOrder.status !== FoodOrderStatus.Completed && selectedOrder.status !== FoodOrderStatus.Cancelled) ||
                  (!isMerchant && selectedOrder.status === FoodOrderStatus.Placed)) && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder)}
                    disabled={cancelOrder.isPending || updateStatus.isPending || actioningId !== null}
                    className="h-9 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {actioningId === `cancel-${selectedOrder.id}` ? (
                      <span className="h-3 w-3 border-2 border-red-650 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    Cancel & Refund
                  </button>
                )}

                {/* Advance Status Button for Merchant */}
                {isMerchant &&
                  selectedOrder.status !== FoodOrderStatus.Completed &&
                  selectedOrder.status !== FoodOrderStatus.Cancelled && (
                    <button
                      onClick={() => handleAdvanceStatus(selectedOrder)}
                      disabled={updateStatus.isPending || cancelOrder.isPending || actioningId !== null}
                      className="h-9 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg cursor-pointer hover:opacity-90 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {actioningId === `status-${selectedOrder.id}` ? (
                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="size-3.5" />
                      )}
                      {selectedOrder.status === FoodOrderStatus.Placed && "Accept & Prepare"}
                      {selectedOrder.status === FoodOrderStatus.Preparing && "Mark Ready for Pickup"}
                      {selectedOrder.status === FoodOrderStatus.ReadyForPickup && "Complete Order"}
                    </button>
                  )}

                {/* Simple support help text */}
                {!isMerchant && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mr-auto pl-2 font-medium">
                    <HelpCircle className="size-3.5" />
                    Need help? Ask canteen counter.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[450px]">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-semibold">Select an order</p>
              <p className="text-xs mt-1">Choose any active or historical food order from the queue to track progress live.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default OrderTracking;
