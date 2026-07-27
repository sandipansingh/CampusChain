"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useCampusUserRole } from "@/features/wallet/hooks/useWallet";
import {
  TrendingUp,
  Receipt,
  Package,
  Bell,
  AlertCircle,
  Store,
} from "lucide-react";

type DashboardState = "success" | "loading" | "empty";

interface SaleTransaction {
  id: string;
  studentName: string;
  studentInitials: string;
  amountXlm: string;
  amountCamp: string;
  time: string;
  status: "Confirmed" | "Pending";
}

const mockSales: SaleTransaction[] = [
  { id: "sale1", studentName: "John D.", studentInitials: "JD", amountXlm: "14.50 XLM", amountCamp: "1,450 CAMP", time: "12:42 PM", status: "Confirmed" },
  { id: "sale2", studentName: "Alice S.", studentInitials: "AS", amountXlm: "8.25 XLM", amountCamp: "825 CAMP", time: "12:15 PM", status: "Confirmed" },
  { id: "sale3", studentName: "Mark K.", studentInitials: "MK", amountXlm: "45.00 XLM", amountCamp: "4,500 CAMP", time: "11:30 AM", status: "Confirmed" },
];

export function MerchantDashboard() {
  const { address } = useWallet();
  const [dbState, setDbState] = useState<DashboardState>("success");
  const [payAmount, setPayAmount] = useState("");

  const { data: userRole, isLoading: isRoleLoading } = useCampusUserRole(address);

  if (isRoleLoading) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl max-w-md mx-auto space-y-4">
        <Skeleton className="h-6 w-3/4 mx-auto animate-pulse" />
        <Skeleton className="h-20 w-full animate-pulse" />
      </div>
    );
  }

  // Enforce Merchant (2) or Admin (4)
  if (userRole !== 2 && userRole !== 4) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl max-w-md mx-auto space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">Access Denied</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Only users registered with the Merchant role can view this dashboard. Please request a role change from an administrator if needed.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Merchant Sales Portal</h3>
        <div className="w-40">
          <Dropdown<DashboardState>
            options={[
              { value: "success", label: "State: Success" },
              { value: "loading", label: "State: Loading" },
              { value: "empty", label: "State: Empty" },
            ]}
            value={dbState}
            onChange={(val) => setDbState(val)}
          />
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Generate Invoice QR */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* QR Generator Card */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">Request Payment</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Input the amount to generate a customer-facing payment QR code.
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="qr-amount">
                  Invoice Amount (CAMP)
                </label>
                <input
                  id="qr-amount"
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
              >
                Generate Checkout QR
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Recent Sales */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Recent Receipts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live incoming transfers matching your merchant profile.
            </p>
          </div>

          {dbState === "loading" ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border border-border p-5 rounded-2xl space-y-3">
                  <Skeleton className="h-6 w-1/2 animate-pulse" />
                  <Skeleton className="h-10 w-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : dbState === "empty" || mockSales.length === 0 ? (
            <div className="p-16 border border-border rounded-2xl bg-card text-center flex flex-col items-center justify-center gap-3">
              <Receipt className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-base font-bold">No Sales Registered</h3>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
              {mockSales.map((sale) => (
                <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-[10px]">
                      {sale.studentInitials}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{sale.studentName}</p>
                      <p className="text-muted-foreground mt-0.5">{sale.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-foreground">{sale.amountCamp}</p>
                    <p className="text-emerald-600 font-bold uppercase tracking-wider text-[9px] mt-0.5">{sale.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default MerchantDashboard;
