"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  Plus,
  Edit2,
  RefreshCw,
  Clock,
  ChefHat,
  Search,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  useMenuItems,
  usePublishMenuItemMutation,
  useUpdateMenuItemMutation,
  useFoodOrders,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
} from "../hooks";
import { MenuItem, FoodOrderStatus, FoodOrderStatusLabels } from "../types";

export function MenuManagement() {
  const { address } = useWallet();
  const menuQuery = useMenuItems(address ?? undefined);
  const ordersQuery = useFoodOrders(address ?? undefined);

  const publishItem = usePublishMenuItemMutation();
  const updateItem = useUpdateMenuItemMutation();
  const updateStatus = useUpdateOrderStatusMutation();
  const cancelOrder = useCancelOrderMutation();

  // Search and Category filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Form Modals / State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actioningId, setActioningId] = useState<string | number | null>(null);

  // Filter merchant menu items
  const myItems = (menuQuery.data ?? []).filter(
    (item) => item.merchant.toLowerCase() === address?.toLowerCase()
  );

  // Filter incoming orders for this merchant
  const activeOrders = (ordersQuery.data ?? []).filter(
    (order) =>
      order.merchant.toLowerCase() === address?.toLowerCase() &&
      order.status !== FoodOrderStatus.Completed &&
      order.status !== FoodOrderStatus.Cancelled
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setAvailable(true);
    setStatusMsg(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.priceCamp.toString());
    setAvailable(item.available);
    setStatusMsg(null);
    setShowFormModal(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !name || !price) return;
    setStatusMsg(null);
    try {
      await publishItem.mutateAsync({
        merchant: address,
        name: name.trim(),
        description: description.trim(),
        priceCamp: Number(price),
        available,
      });
      resetForm();
      setShowFormModal(false);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to publish item.",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !editingItem || !name || !price) return;
    setStatusMsg(null);
    try {
      await updateItem.mutateAsync({
        merchant: address,
        itemId: editingItem.id,
        name: name.trim(),
        description: description.trim(),
        priceCamp: Number(price),
        available,
      });
      setEditingItem(null);
      resetForm();
      setShowFormModal(false);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update item.",
      });
    }
  };

  // Toggle availability switch directly
  const handleToggleAvailable = async (item: MenuItem) => {
    if (!address) return;
    setActioningId(`toggle-${item.id}`);
    try {
      await updateItem.mutateAsync({
        merchant: address,
        itemId: item.id,
        name: item.name,
        description: item.description,
        priceCamp: item.priceCamp,
        available: !item.available,
      });
    } catch (err) {
      console.error("Failed to toggle availability", err);
    } finally {
      setActioningId(null);
    }
  };

  // Process status update on orders
  const handleAdvanceStatus = async (orderId: number, currentStatus: FoodOrderStatus) => {
    if (!address) return;
    setActioningId(`status-${orderId}`);
    try {
      let nextStatus = FoodOrderStatus.Preparing;
      if (currentStatus === FoodOrderStatus.Placed) {
        nextStatus = FoodOrderStatus.Preparing;
      } else if (currentStatus === FoodOrderStatus.Preparing) {
        nextStatus = FoodOrderStatus.ReadyForPickup;
      } else if (currentStatus === FoodOrderStatus.ReadyForPickup) {
        nextStatus = FoodOrderStatus.Completed;
      }
      await updateStatus.mutateAsync({
        merchant: address,
        orderId,
        newStatus: nextStatus,
      });
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setActioningId(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!address) return;
    if (!confirm("Are you sure you want to cancel and refund this order?")) return;
    setActioningId(`cancel-${orderId}`);
    try {
      await cancelOrder.mutateAsync({
        caller: address,
        orderId,
      });
    } catch (err) {
      console.error("Failed to cancel order", err);
    } finally {
      setActioningId(null);
    }
  };

  // Client-side filtering logic matching categories
  const filteredItems = myItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Stitch category names map: Meals, Drinks, Snacks
    if (selectedCategory === "All Categories") return matchesSearch;
    
    // Simple category mapping based on descriptions or custom names
    const descLower = item.description.toLowerCase();
    const nameLower = item.name.toLowerCase();
    const isDrink =
      descLower.includes("drink") ||
      descLower.includes("tea") ||
      descLower.includes("coffee") ||
      descLower.includes("juice") ||
      descLower.includes("iced") ||
      nameLower.includes("coffee") ||
      nameLower.includes("latte") ||
      nameLower.includes("soda");
    
    const isSnack =
      descLower.includes("snack") ||
      descLower.includes("cookie") ||
      descLower.includes("fruit") ||
      descLower.includes("chips") ||
      descLower.includes("fry") ||
      descLower.includes("fries");

    if (selectedCategory === "Drinks") return matchesSearch && isDrink;
    if (selectedCategory === "Snacks") return matchesSearch && isSnack;
    if (selectedCategory === "Meals") return matchesSearch && !isDrink && !isSnack;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full items-stretch min-h-[calc(100vh-10rem)]">
      {/* Left Column: Menu Management */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <header className="p-6 border-b border-border flex justify-between items-center bg-card">
          <div>
            <h1 className="text-lg font-bold text-foreground">My Menu</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage items, prices, and availability.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="size-4" /> Add Item
          </button>
        </header>

        {/* Filters/Search Bar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground text-xs"
              placeholder="Search menu items..."
              type="text"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-foreground text-xs text-foreground cursor-pointer"
          >
            <option>All Categories</option>
            <option>Meals</option>
            <option>Drinks</option>
            <option>Snacks</option>
          </select>
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[500px]">
          {menuQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ChefHat className="size-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">No items on your menu yet.</p>
              <p className="text-xs">Add items above to start receiving canteen orders!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card p-4 rounded-lg border border-border flex items-center gap-4 hover:shadow-sm transition-all group"
                >
                  <div className="w-12 h-12 bg-muted/40 rounded-md flex items-center justify-center text-muted-foreground">
                    <ChefHat className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-sm text-foreground truncate">{item.name}</h3>
                      <span className="bg-muted text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                        {/* Categorize simple labels */}
                        {item.description.toLowerCase().includes("drink") || item.name.toLowerCase().includes("coffee")
                          ? "Drinks"
                          : item.description.toLowerCase().includes("snack")
                          ? "Snacks"
                          : "Meals"}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs text-foreground">{item.priceCamp.toLocaleString()} CAMP</span>
                      <span className="text-[10px] text-muted-foreground font-medium">≈ {(item.priceCamp / 10).toFixed(1)} XLM</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-semibold">Available Today</span>
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        disabled={actioningId === `toggle-${item.id}`}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0 ${
                          item.available ? "bg-primary" : "bg-muted-foreground/30"
                        } disabled:opacity-50`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.available ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Incoming Orders Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden shrink-0">
        <header className="p-6 border-b border-border bg-card flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Live Orders</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{activeOrders.length} active orders</p>
          </div>
          <button
            onClick={() => ordersQuery.refetch()}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`size-4 ${ordersQuery.isFetching ? "animate-spin" : ""}`} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-muted/10 max-h-[500px]">
          {ordersQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <Clock className="size-8 mb-2 opacity-40 animate-pulse" />
              <p className="text-xs font-semibold">No active orders yet.</p>
              <p className="text-[10px] text-muted-foreground max-w-xs mt-0.5">
                New student orders will appear here automatically in real time.
              </p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <div key={order.id} className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-border/60 pb-2">
                  <div>
                    <p className="font-bold text-xs text-foreground">Order #{order.id}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {order.placedAt ? new Date(order.placedAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    order.status === FoodOrderStatus.Placed
                      ? "bg-muted text-muted-foreground border border-border"
                      : order.status === FoodOrderStatus.Preparing
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {FoodOrderStatusLabels[order.status]}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between text-foreground">
                    <span className="font-medium">
                      {order.quantity}x {order.menuItemName || `Menu Item #${order.menuItemId}`}
                    </span>
                    <span className="font-bold">{order.totalCamp.toLocaleString()} C</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">
                    Total: <strong className="text-foreground text-xs">{order.totalCamp.toLocaleString()} CAMP</strong>
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {order.status !== FoodOrderStatus.ReadyForPickup && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, order.status)}
                        disabled={actioningId === `status-${order.id}`}
                        className="bg-primary text-primary-foreground font-bold text-[10px] px-2.5 py-1.5 rounded hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actioningId === `status-${order.id}` ? (
                          <span className="block h-2.5 w-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : order.status === FoodOrderStatus.Placed ? (
                          "Start Preparing"
                        ) : (
                          "Mark Ready"
                        )}
                      </button>
                    )}

                    {order.status === FoodOrderStatus.ReadyForPickup && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, order.status)}
                        disabled={actioningId === `status-${order.id}`}
                        className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actioningId === `status-${order.id}` ? (
                          <span className="block h-2.5 w-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Complete Order"
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={actioningId === `cancel-${order.id}`}
                      className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                      title="Cancel & Refund"
                    >
                      <XCircle className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <form
            onSubmit={editingItem ? handleUpdate : handlePublish}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg space-y-4 relative"
          >
            <h3 className="text-sm font-bold text-foreground">
              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
            </h3>

            {statusMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-800 flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold text-muted-foreground">
                Item Name *
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Classic Smashburger"
                  required
                  className="mt-1 h-9 w-full border border-border rounded-lg px-3 text-xs text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </label>

              <label className="block text-xs font-bold text-muted-foreground">
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Double beef patty, cheddar, brioche bun..."
                  rows={3}
                  className="mt-1 w-full border border-border rounded-lg p-3 text-xs text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-muted-foreground">
                  Price (CAMP) *
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="15.00"
                    required
                    className="mt-1 h-9 w-full border border-border rounded-lg px-3 text-xs text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </label>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(e) => setAvailable(e.target.checked)}
                      className="rounded border-border bg-transparent focus:ring-0 text-primary"
                    />
                    Available for Order
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 justify-end border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                className="h-9 px-3 border border-border text-foreground hover:bg-muted text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishItem.isPending || updateItem.isPending}
                className="h-9 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5"
              >
                {(publishItem.isPending || updateItem.isPending) && (
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {editingItem ? "Save Changes" : "Create Item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;
