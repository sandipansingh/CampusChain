"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Settings as SettingsIcon, User } from "lucide-react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  useCampusProfile,
  useUpdateProfileMutation,
} from "@/features/wallet/hooks/useWallet";
import { NetworkType, useWalletStore } from "@/features/wallet/state/useWalletStore";

const roleLabel: Record<number, string> = {
  1: "Student",
  2: "Merchant",
  3: "Club organizer",
  4: "Administrator",
};

export function Settings() {
  const { address } = useWallet();
  const { data: profile, isLoading, isError, error, refetch } = useCampusProfile(address);
  const updateProfile = useUpdateProfileMutation();
  const network = useWalletStore((state) => state.network);
  const networkPassphrase = useWalletStore((state) => state.networkPassphrase);
  const switchNetwork = useWalletStore((state) => state.switchNetwork);
  const [copied, setCopied] = useState(false);
  const [fullName, setFullName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setUniversityId(profile.universityId);
    setDepartment(profile.department);
  }, [profile]);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };

  const submitProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!address) return;
    updateProfile.mutate({ address, fullName: fullName.trim(), universityId: universityId.trim(), department: department.trim() });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-4 w-4" />
          <div>
            <h3 className="text-base font-bold">On-chain profile</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Fields are stored in the CampusIdentity contract.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ) : isError ? (
          <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 text-sm">
            <p className="font-semibold">Could not load your on-chain profile.</p>
            <p className="text-xs text-muted-foreground mt-1 break-words">{error instanceof Error ? error.message : "Please retry the contract read."}</p>
            <button onClick={() => refetch()} className="mt-3 text-xs font-semibold underline underline-offset-4">Retry</button>
          </div>
        ) : !profile ? (
          <div className="border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground">No profile is registered for this connected wallet.</div>
        ) : (
          <form onSubmit={submitProfile} className="space-y-4">
            <ProfileInput label="Full name" value={fullName} onChange={setFullName} />
            <ProfileInput label="University ID" value={universityId} onChange={setUniversityId} />
            <ProfileInput label="Department" value={department} onChange={setDepartment} />
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <InfoField label="Role" value={roleLabel[profile.role] ?? `Role ${profile.role}`} />
              <InfoField label="Verification" value={profile.verified ? "Verified" : "Not verified"} />
              <div className="sm:col-span-2">
                <dt className="font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Wallet address</dt>
                <dd className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border border-border min-w-0">
                  <span className="flex-1 text-xs text-muted-foreground font-mono truncate select-all" title={address ?? undefined}>{address}</span>
                  <button type="button" onClick={handleCopy} className="p-1.5 bg-card border border-border rounded-md shrink-0" aria-label="Copy wallet address">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </dd>
              </div>
            </dl>
            {updateProfile.isError && <p className="text-xs text-destructive">{updateProfile.error instanceof Error ? updateProfile.error.message : "Profile update failed."}</p>}
            {updateProfile.isSuccess && <p className="text-xs text-emerald-700">Profile confirmed on Testnet.</p>}
            <button type="submit" disabled={updateProfile.isPending || !fullName.trim() || !universityId.trim() || !department.trim()} className="h-11 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
              {updateProfile.isPending ? "Saving profile" : "Save on-chain profile"}
            </button>
          </form>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5"><SettingsIcon className="h-4 w-4" /><h3 className="text-base font-bold">Network</h3></div>
        <div className="space-y-4">
          <Dropdown<NetworkType> options={[{ value: "testnet", label: "Stellar Testnet" }, { value: "public", label: "Stellar Public Network" }, { value: "standalone", label: "Standalone local network" }]} value={network} onChange={switchNetwork} />
          <dl className="text-xs space-y-2 bg-muted/30 border border-border rounded-lg p-4">
            <InfoField label="Passphrase" value={networkPassphrase ?? "Unavailable"} />
            <InfoField label="Soroban RPC" value={network === "testnet" ? "https://soroban-testnet.stellar.org" : network === "public" ? "https://soroban.stellar.org" : "Configured local RPC"} />
          </dl>
        </div>
      </section>
    </div>
  );
}

function ProfileInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor={id}>{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} required className="mt-1.5 w-full h-11 px-3 bg-card border border-border rounded-lg text-sm font-normal text-foreground normal-case tracking-normal focus:outline-none focus:ring-1 focus:ring-foreground" /></label>;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-bold uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-1 text-foreground break-words" title={value}>{value}</dd></div>;
}

export default Settings;
