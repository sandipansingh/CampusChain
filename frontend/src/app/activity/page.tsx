"use client";

import Link from "next/link";

export default function ActivityFeedPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>CampusChain Activity Feed (Skeleton)</h1>
      <p><Link href="/">← Back to Landing</Link></p>
      <p>Real-time updates of transfers, escrows, and ticket purchases will appear here.</p>
    </div>
  );
}
