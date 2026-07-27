"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { useWalletStore, NetworkType } from "@/features/wallet/state/useWalletStore";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  Mail,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  EyeOff,
  User,
  AlertCircle,
  Settings as SettingsIcon,
} from "lucide-react";

type SettingsState = "success" | "loading" | "empty";
type SettingsTab = "profile" | "network" | "security" | "notifications";

export function Settings() {
  const { address } = useWallet();
  const [settingsState, setSettingsState] = useState<SettingsState>("success");
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const network = useWalletStore((state) => state.network);
  const networkPassphrase = useWalletStore((state) => state.networkPassphrase);
  const switchNetwork = useWalletStore((state) => state.switchNetwork);

  // Wallet copy state
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Security Toggles
  const [biometric, setBiometric] = useState(true);
  const [transactionPin, setTransactionPin] = useState(false);

  // Notification Toggles
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { value: SettingsTab; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
    { value: "profile", label: "Profile", icon: User },
    { value: "network", label: "Stellar Network", icon: SettingsIcon },
    { value: "security", label: "Security & Keys", icon: ShieldCheck },
    { value: "notifications", label: "Notifications", icon: BellIcon },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Tab Selector Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 cursor-pointer ${
                activeTab === t.value
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main card panel */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Profile Settings</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your campus identifier details.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Associated Address
                </label>
                <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border border-border">
                  <span className="flex-1 text-xs text-muted-foreground font-mono truncate select-all">
                    {address || "Not connected"}
                  </span>
                  {address && (
                    <button
                      onClick={handleCopy}
                      className="p-1.5 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <CopyIcon className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="email">
                  Campus Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="email"
                    type="email"
                    defaultValue="student@university.edu"
                    className="w-full h-11 pl-9 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Stellar Network Configuration</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage RPC networks, nodes, and passphrases.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Select Active Network
                </label>
                <Dropdown<NetworkType>
                  options={[
                    { value: "testnet", label: "Stellar Testnet" },
                    { value: "public", label: "Stellar Public Global" },
                    { value: "standalone", label: "Standalone Local RPC" },
                  ]}
                  value={network}
                  onChange={(val) => switchNetwork(val)}
                />
              </div>

              <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Passphrase:</span>
                  <span className="font-bold font-mono">{networkPassphrase || "Test SDF Network ; September 2015"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RPC URL:</span>
                  <span className="font-mono text-muted-foreground truncate max-w-[200px] md:max-w-none">
                    {network === "testnet" ? "https://soroban-testnet.stellar.org" : "https://horizon.stellar.org"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Security Preferences</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Configure transaction confirmation safety.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Biometric Signatures</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Confirm transaction signatures with Face/Touch ID.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={biometric}
                  onChange={(e) => setBiometric(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Require Pin Code</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Ask for validation PIN before invoking smart contracts.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={transactionPin}
                  onChange={(e) => setTransactionPin(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Notification Settings</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Control payment checkout receipt alerts.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div>
                  <p className="text-xs font-bold text-foreground">Payment Invoices</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Get alert notifications for peer-to-peer transfers.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPayments}
                  onChange={(e) => setNotifPayments(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div>
                  <p className="text-xs font-bold text-foreground">Marketplace Sales</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Receive notifications when your listings sell.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifMarket}
                  onChange={(e) => setNotifMarket(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-icons overrides
function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export default Settings;
