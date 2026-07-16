"use client";

import Link from "next/link";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusBalance, useCampusUserRole } from "@/hooks/useCampusToken";

export default function DashboardPage() {
  const { address } = useWalletStore();
  const { data: balance, isLoading: balanceLoading } = useCampusBalance(address);
  const { data: role, isLoading: roleLoading } = useCampusUserRole(address);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>CampusChain Dashboard (Skeleton)</h1>
      <p><Link href="/">← Back to Landing</Link></p>

      {address ? (
        <div>
          <p>User Address: {address}</p>
          <p>
            Balance:{" "}
            {balanceLoading ? "Loading balance..." : `${balance} CAMP`}
          </p>
          <p>
            User Role:{" "}
            {roleLoading
              ? "Loading role..."
              : role === 1
              ? "Student"
              : role === 2
              ? "Merchant"
              : role === 3
              ? "Club Organizer"
              : role === 4
              ? "University Admin"
              : "Guest"}
          </p>
        </div>
      ) : (
        <p style={{ color: "red" }}>Please connect your wallet first on the landing page.</p>
      )}
    </div>
  );
}
