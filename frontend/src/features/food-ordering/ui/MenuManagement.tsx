"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Plus, Edit2, CheckCircle2, XCircle, Store, Eye, EyeOff } from "lucide-react";
import {
  useMenuItems,
  usePublishMenuItemMutation,
  useUpdateMenuItemMutation,
} from "../hooks";
import { MenuItem } from "../types";

export function MenuManagement() {
  const { address } = useWallet();
  const menuQuery = useMenuItems(address ?? undefined);
  const publishItem = usePublishMenuItemMutation();
  const updateItem = useUpdateMenuItemMutation();

  // Local form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const myItems = (menuQuery.data ?? []).filter(
    (item) => item.merchant.toLowerCase() === address?.toLowerCase()
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setAvailable(true);
    setStatusMsg(null);
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
      setStatusMsg({ type: "success", text: "Menu item published successfully!" });
      resetForm();
      setShowAddForm(false);
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
      setStatusMsg({ type: "success", text: "Menu item updated successfully!" });
      setEditingItem(null);
      resetForm();
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update item.",
      });
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.priceCamp.toString());
    setAvailable(item.available);
    setShowAddForm(false);
    setStatusMsg(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Menu Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure items, prices, and availability for your canteen menu.
          </p>
        </div>
        {!showAddForm && !editingItem && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="h-9 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="size-4" /> Add Item
          </button>
        )}
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-destructive/5 text-destructive border-destructive/20"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Add / Edit Form */}
      {(showAddForm || editingItem) && (
        <form
          onSubmit={editingItem ? handleUpdate : handlePublish}
          className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg shadow-sm"
        >
          <h3 className="text-sm font-bold">
            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
          </h3>
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground">
              Item Name *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Canteen Special Burger"
                required
                className="mt-1 h-10 w-full border border-border rounded-lg px-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </label>
            <label className="block text-xs font-bold text-muted-foreground">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Delicious grilled patty with cheddar cheese..."
                rows={3}
                className="mt-1 w-full border border-border rounded-lg p-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-muted-foreground">
                Price (CAMP) *
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5.00"
                  required
                  className="mt-1 h-10 w-full border border-border rounded-lg px-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
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
          <div className="flex gap-2 pt-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                resetForm();
              }}
              className="h-9 px-3 border border-border text-foreground hover:bg-muted text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={publishItem.isPending || updateItem.isPending}
              className="h-9 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              {(publishItem.isPending || updateItem.isPending) && (
                <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {editingItem ? "Update Item" : "Publish Item"}
            </button>
          </div>
        </form>
      )}

      {/* Menu List */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold">Your Published Items</h3>
        {menuQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : myItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No items on your menu yet. Add items above to start receiving canteens orders!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 border border-border/80 rounded-lg bg-muted/10 gap-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <span className="text-xs font-extrabold text-foreground shrink-0">
                      {item.priceCamp.toLocaleString()} CAMP
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description || "No description provided."}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {item.available ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        <Eye className="size-3" /> Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        <EyeOff className="size-3" /> Unavailable
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => startEdit(item)}
                    className="h-8 px-2.5 border border-border text-foreground hover:bg-muted text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="size-3" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuManagement;
