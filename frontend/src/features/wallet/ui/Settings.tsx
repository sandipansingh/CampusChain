"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  LayoutDashboard,
  Wallet,
  Coins,
  Store,
  Calendar,
  Award,
  GraduationCap,
  Receipt,
  Settings as SettingsIcon,
  Bell,
  HelpCircle,
  Mail,
  Copy,
  Key,
  Check,
  ShieldCheck,
  Smartphone,
  EyeOff,
  User,
  AlertCircle,
  Menu,
} from "lucide-react";

type SettingsState = "success" | "loading" | "empty";
type SettingsTab = "profile" | "security" | "notifications" | "linked" | "help";

export function Settings() {
  const { disconnect } = useWallet();
  const [settingsState, setSettingsState] = useState<SettingsState>("success");
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Wallet copy and reveal key states
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Security Toggles
  const [biometric, setBiometric] = useState(true);
  const [transactionPin, setTransactionPin] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Notification Toggles
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);
  const [notifEvents, setNotifEvents] = useState(false);
  const [notifRewards, setNotifRewards] = useState(true);

  const stellarAddress = "GBSX4Y2A...7Y2A";
  const mockSecretKey = "SBUV23O...J47X";

  const handleCopy = () => {
    navigator.clipboard.writeText("GBSX4Y2A7Y2A");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: false },
    { label: "Pay (QR)", icon: Coins, href: "#", active: false },
    { label: "Marketplace", icon: Store, href: "#", active: false },
    { label: "Events", icon: Calendar, href: "#", active: false },
    { label: "Rewards", icon: Award, href: "#", active: false },
    { label: "Scholarships", icon: GraduationCap, href: "#", active: false },
    { label: "Transactions", icon: Receipt, href: "#", active: false },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
            CC
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">University Payments</p>
          </div>
        </div>

        <nav className="flex-grow space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium transition-all"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 space-y-1 mt-auto">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-secondary text-secondary-foreground font-bold border-r-4 border-primary transition-all"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Settings</span>
          </a>
          <button
            onClick={disconnect}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive font-medium transition-all text-left cursor-pointer"
          >
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow md:ml-64 flex flex-col h-full overflow-hidden">
        {/* 2. Top Navbar */}
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold">Settings</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<SettingsState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={settingsState}
                onChange={(val) => setSettingsState(val)}
              />
            </div>

            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <HelpCircle className="h-5 w-5" />
            </button>

            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border border-border">
              CC
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative h-full">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* MOBILE ONLY: Top Header */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<SettingsState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={settingsState}
                    onChange={(val) => setSettingsState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  CC
                </div>
              </div>
            </div>

            {settingsState === "loading" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3">
                  <Skeleton className="h-44 w-full rounded-xl" />
                </div>
                <div className="lg:col-span-9 space-y-6">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ) : settingsState === "empty" ? (
              <div className="p-16 border border-border rounded-xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-md font-bold">Failed to Load Settings</h3>
                <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                  Your profile and security configuration settings could not be retrieved. Please check wallet connection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 3. Left Local Navigation Tabs */}
                <div className="lg:col-span-3">
                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1">
                    {[
                      { value: "profile", label: "Profile" },
                      { value: "security", label: "Wallet & Security" },
                      { value: "notifications", label: "Notifications" },
                      { value: "linked", label: "Linked Accounts" },
                      { value: "help", label: "Help" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value as SettingsTab)}
                        className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === tab.value
                            ? "bg-secondary text-secondary-foreground font-bold"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Area: Dynamic tab content */}
                <div className="lg:col-span-9 space-y-6">
                  
                  {activeTab === "profile" && (
                    <section className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 animate-in fade-in duration-200">
                      <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 font-black text-2xl select-none">
                        JD
                      </div>
                      <div className="flex-grow space-y-2 min-w-0">
                        <h3 className="text-lg font-bold text-foreground">John Doe</h3>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0" />
                            <span>Student ID: U-4921</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">john.doe@university.edu</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-full md:w-auto px-5 py-2 border border-border text-foreground hover:bg-accent font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0">
                        Edit Profile
                      </button>
                    </section>
                  )}

                  {activeTab === "security" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                      
                      {/* Wallet and Keys */}
                      <section className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
                        <div>
                          <h3 className="text-sm font-bold text-foreground mb-4 pb-2 border-b border-border">
                            Wallet Address
                          </h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                                Stellar Public Key
                              </label>
                              <div className="flex h-10 bg-muted/40 border border-border rounded-lg overflow-hidden focus-within:border-foreground transition-colors font-mono">
                                <input
                                  type="text"
                                  value={stellarAddress}
                                  readOnly
                                  className="w-full bg-transparent border-none py-2 px-3 text-xs focus:ring-0 focus:outline-none select-all text-muted-foreground"
                                />
                                <button
                                  onClick={handleCopy}
                                  className="px-3 border-l border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Secret Reveal */}
                            <div className="pt-2">
                              {showSecret ? (
                                <div className="space-y-2 animate-in slide-in-from-top-1 duration-150">
                                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                    Stellar Secret Key
                                  </label>
                                  <div className="flex h-10 bg-muted/40 border border-border rounded-lg overflow-hidden font-mono">
                                    <input
                                      type="text"
                                      value={mockSecretKey}
                                      readOnly
                                      className="w-full bg-transparent border-none py-2 px-3 text-xs focus:ring-0 focus:outline-none text-muted-foreground font-semibold"
                                    />
                                    <button
                                      onClick={() => setShowSecret(false)}
                                      className="px-3 border-l border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                      <EyeOff className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowSecret(true)}
                                  className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Key className="h-4 w-4" />
                                  <span>Reveal Secret Key</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Device Toggles */}
                      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-4 pb-2 border-b border-border">
                          Device Security
                        </h3>

                        <div className="space-y-4 pt-1">
                          {[
                            {
                              label: "Biometric Lock",
                              value: biometric,
                              onChange: setBiometric,
                              icon: ShieldCheck,
                            },
                            {
                              label: "Transaction PIN",
                              value: transactionPin,
                              onChange: setTransactionPin,
                              icon: Smartphone,
                            },
                            {
                              label: "Email Alerts",
                              value: emailAlerts,
                              onChange: setEmailAlerts,
                              icon: Mail,
                            },
                          ].map((tog) => {
                            const TogIcon = tog.icon;
                            return (
                              <div key={tog.label} className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                                  <TogIcon className="h-4.5 w-4.5 text-muted-foreground/80 shrink-0" />
                                  <span>{tog.label}</span>
                                </span>
                                
                                <button
                                  onClick={() => tog.onChange(!tog.value)}
                                  className={`w-10 h-5 rounded-full relative transition-all duration-200 cursor-pointer focus:outline-none ${
                                    tog.value ? "bg-primary border border-primary" : "bg-muted border border-border"
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow ${
                                      tog.value ? "right-0.5" : "left-0.5"
                                    }`}
                                  ></span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                    </div>
                  )}

                  {activeTab === "notifications" && (
                    <section className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-200 max-w-md">
                      <h3 className="text-sm font-bold text-foreground mb-4 pb-2 border-b border-border">
                        Notification Preferences
                      </h3>

                      <div className="space-y-4 pt-2">
                        {[
                          { label: "Payments & Transfers", val: notifPayments, setVal: setNotifPayments },
                          { label: "Marketplace Updates", val: notifMarket, setVal: setNotifMarket },
                          { label: "Event Reminders", val: notifEvents, setVal: setNotifEvents },
                          { label: "Reward Redeems & Alerts", val: notifRewards, setVal: setNotifRewards },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{item.label}</span>
                            <button
                              onClick={() => item.setVal(!item.val)}
                              className={`w-10 h-5 rounded-full relative transition-all duration-200 cursor-pointer focus:outline-none ${
                                item.val ? "bg-primary border border-primary" : "bg-muted border border-border"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow ${
                                  item.val ? "right-0.5" : "left-0.5"
                                }`}
                              ></span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {activeTab === "linked" && (
                    <section className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-200">
                      <h3 className="text-sm font-bold text-foreground mb-4 pb-2 border-b border-border">
                        Linked Web3 Accounts
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Manage linked Stellar identities and university profile credentials connected to the smart contract registries.
                      </p>
                    </section>
                  )}

                  {activeTab === "help" && (
                    <section className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-200">
                      <h3 className="text-sm font-bold text-foreground mb-4 pb-2 border-b border-border">
                        CampusChain Help & FAQ
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        For any issues regarding Stellar wallet routing, Freighter signing, or merchant purchases, please submit a ticket to Campus Tech support.
                      </p>
                    </section>
                  )}

                </div>

              </div>
            )}

          </div>
        </main>
      </div>

      {/* 5. Mobile Bottom Tab Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-45 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Dashboard", icon: LayoutDashboard, active: false },
          { label: "Wallet", icon: Wallet, active: false },
          { label: "Pay", icon: Coins, active: false },
          { label: "Market", icon: Store, active: false },
          { label: "More", icon: Menu, active: true },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex flex-col items-center justify-center w-16 py-2.5 transition-all cursor-pointer ${
                item.active ? "text-foreground font-bold scale-105" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Settings;
