"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  ClipboardList,
  ChevronRight,
  Flame,
  PackageCheck,
  CheckCircle,
  XCircle,
  Timer,
  ShoppingBag,
  ArrowRight,
  Clock,
  User,
  Coffee,
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

  const orders = ordersQuery.data ?? [];
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleAdvanceStatus = async (order: FoodOrder) => {
    if (!address) return;
    setActionError(null);
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
    }
  };

  const handleCancelOrder = async (order: FoodOrder) => {
    if (!address) return;
    setActionError(null);
    try {
      await cancelOrder.mutateAsync({
        caller: address,
        orderId: order.id,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel order.");
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getStatusColor = (status: FoodOrderStatus) => {
    switch (status) {
      case FoodOrderStatus.Placed:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case FoodOrderStatus.Preparing:
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
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

  const steps = [
    { label: "Placed", status: FoodOrderStatus.Placed, icon: ShoppingBag },
    { label: "Preparing", status: FoodOrderStatus.Preparing, icon: Flame },
    { label: "Ready", status: FoodOrderStatus.ReadyForPickup, icon: PackageCheck },
    { label: "Completed", status: FoodOrderStatus.Completed, icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          {isMerchant ? "Incoming & Active Orders" : "My Food Orders"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isMerchant
            ? "Manage, prepare, and advance canteens orders placed by students."
            : "Track the preparation and pickup status of your canteen orders live."}
        </p>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg border text-xs font-semibold bg-destructive/5 text-destructive border-destructive/20 flex items-center gap-2">
          <XCircle className="size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Orders List */}
        <div className="md:col-span-1 bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
            Orders Queue
          </h3>

          {ordersQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">
              No orders found in history.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setSelectedOrderId(o.id);
                    setActionError(null);
                  }}
                  className={`w-full text-left p-3 border rounded-lg flex flex-col gap-2 transition-colors cursor-pointer ${
                    selectedOrderId === o.id
                      ? "bg-primary/5 border-primary text-foreground"
                      : "bg-transparent border-transparent hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-foreground">Order #{o.id}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="size-3" />
                      {new Date(o.placedAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {/* Right Column: Tracking Details */}
        <div className="md:col-span-2 space-y-4">
          {selectedOrder ? (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Order Details</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <User className="size-3.5" />
                    {isMerchant ? (
                      <>
                        Student: <span className="font-mono text-[11px]">{formatAddress(selectedOrder.student)}</span>
                      </>
                    ) : (
                      <>
                        Canteen: <span className="font-mono text-[11px]">{formatAddress(selectedOrder.merchant)}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">Order ID: #{selectedOrder.id}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(selectedOrder.placedAt * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-muted/10 border border-border/60 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ordered Items</h4>
                <div className="flex justify-between items-center text-sm font-semibold text-foreground">
                  <span className="flex-1 truncate">
                    {selectedOrder.quantity}x {selectedOrder.menuItemName || `Item #${selectedOrder.menuItemId}`}
                  </span>
                  <span className="shrink-0">{selectedOrder.totalCamp.toLocaleString()} CAMP</span>
                </div>
                <div className="border-t border-border/40 pt-2 flex justify-between items-center text-xs font-bold text-muted-foreground">
                  <span>Payment Type</span>
                  <span>CAMP Tokens (On-Chain)</span>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Progress</h4>

                {selectedOrder.status === FoodOrderStatus.Cancelled ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <XCircle className="size-4 shrink-0" />
                    <span>This order has been cancelled. Funds were automatically refunded.</span>
                  </div>
                ) : (
                  <div className="relative flex justify-between items-center pt-2 max-w-lg mx-auto">
                    {/* Progress Connecting Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/40 -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                      style={{
                        width: `${
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

                    {steps.map((step, idx) => {
                      const Icon = step.icon;
                      const isCompleted = selectedOrder.status >= step.status;
                      const isActive = selectedOrder.status === step.status;

                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5">
                          <div
                            className={`size-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isCompleted
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-card border-border text-muted-foreground"
                            } ${isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-card animate-pulse" : ""}`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end border-t border-border/60 pt-4">
                {/* Cancel Button */}
                {((isMerchant && selectedOrder.status !== FoodOrderStatus.Completed && selectedOrder.status !== FoodOrderStatus.Cancelled) ||
                  (!isMerchant && selectedOrder.status === FoodOrderStatus.Placed)) && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder)}
                    disabled={cancelOrder.isPending || updateStatus.isPending}
                    className="h-10 px-4 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {cancelOrder.isPending && (
                      <span className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    Cancel Order
                  </button>
                )}

                {/* Advance Status Button for Merchant */}
                {isMerchant &&
                  selectedOrder.status !== FoodOrderStatus.Completed &&
                  selectedOrder.status !== FoodOrderStatus.Cancelled && (
                    <button
                      onClick={() => handleAdvanceStatus(selectedOrder)}
                      disabled={updateStatus.isPending || cancelOrder.isPending}
                      className="h-10 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {updateStatus.isPending && (
                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {selectedOrder.status === FoodOrderStatus.Placed && "Accept & Prepare"}
                      {selectedOrder.status === FoodOrderStatus.Preparing && "Mark Ready for Pickup"}
                      {selectedOrder.status === FoodOrderStatus.ReadyForPickup && "Complete Order"}
                      <ArrowRight className="size-3.5" />
                    </button>
                  )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-semibold">Select an order from the list</p>
              <p className="text-xs mt-1">Click any order to view detailed preparation progress, status logs, and transaction details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;
