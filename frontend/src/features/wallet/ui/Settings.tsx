"use client";

import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { useWallet } from "@/shared/stellar/useWallet";

const roles: Record<number, string> = { 1: "Student", 2: "Merchant", 3: "Event Organizer", 4: "University Admin", 5: "Platform Admin" };
const verification: Record<number, string> = { 1: "Pending", 2: "Verified", 3: "Rejected" };

export function Settings() {
  const { address } = useWallet();
  const { data: profile } = useCampusProfile(address);
  if (!profile) return null;
  return <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6"><h2 className="text-lg font-bold">Identity profile</h2><p className="mt-1 text-sm text-muted-foreground">University code and role are immutable after registration.</p><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><Info label="Name" value={profile.fullName} /><Info label="Role" value={roles[profile.role] ?? "Unknown"} /><Info label="University" value={profile.universityCode ?? "Platform-wide"} /><Info label="Verification" value={verification[profile.verificationStatus] ?? "Unknown"} /></dl></section>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
export default Settings;
