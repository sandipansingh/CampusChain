"use client";

import { useState } from "react";
import { Select, SelectOption } from "@/shared/ui/Select";
import { CustomToggle } from "@/shared/ui/CustomToggle";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  Wallet,
  ChevronRight,
  Lock,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";

interface LoginProps {
  showOnboarding?: boolean;
}

const DEPARTMENTS: SelectOption[] = [
  { value: "cs", label: "Computer Science" },
  { value: "eng", label: "Engineering" },
  { value: "bus", label: "Business" },
  { value: "arts", label: "Arts & Sciences" },
];

export function Login({ showOnboarding: initialShowOnboarding = false }: LoginProps) {
  // Mock Control Panel States (for demonstration of multiple UI states)
  const [currentStep, setCurrentStep] = useState<"connect" | "onboarding" | "success">(
    initialShowOnboarding ? "onboarding" : "connect"
  );
  const [dataState, setDataState] = useState<"loaded" | "loading" | "empty">("loaded");
  const [copied, setCopied] = useState(false);

  // Form States
  const [fullName, setFullName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const mockAddress = "GABCDE...WXYZ1234";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(mockAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectWallet = () => {
    setDataState("loading");
    setTimeout(() => {
      setDataState("loaded");
      setCurrentStep("onboarding");
    }, 1200);
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setDataState("loading");
    setTimeout(() => {
      setDataState("loaded");
      setCurrentStep("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F7F5] text-zinc-950 font-sans flex flex-col items-center justify-center p-6 relative select-none">
      
      {/* ── INTERACTIVE MOCK CONTROL PANEL ── */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-zinc-200 rounded-full px-4 py-2 shadow-sm flex items-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-1 text-zinc-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Interactive Preview:</span>
        </div>
        <div className="flex gap-1.5 border-r border-zinc-200 pr-3">
          <button
            onClick={() => {
              setCurrentStep("connect");
              setDataState("loaded");
            }}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              currentStep === "connect" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            1. Connect
          </button>
          <button
            onClick={() => {
              setCurrentStep("onboarding");
              setDataState("loaded");
            }}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              currentStep === "onboarding" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            2. Onboard
          </button>
          <button
            onClick={() => {
              setCurrentStep("success");
              setDataState("loaded");
            }}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              currentStep === "success" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            3. Success
          </button>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setDataState("loaded")}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              dataState === "loaded" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setDataState("loading")}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              dataState === "loading" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Skeleton
          </button>
          <button
            onClick={() => setDataState("empty")}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              dataState === "empty" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Empty
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-md bg-white border border-zinc-200 rounded-xl p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] relative z-10 flex flex-col items-center">
        
        {/* ─── STATE A: CONNECT WALLET VIEW ─── */}
        {currentStep === "connect" && (
          <div className="w-full flex flex-col items-center">
            {/* Header / Wordmark */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-950 mb-3">CampusChain</h1>
              <p className="text-sm leading-relaxed text-zinc-500 max-w-[280px] mx-auto">
                Your campus wallet for payments, marketplace, events and rewards
              </p>
            </div>

            {/* Content states */}
            {dataState === "loading" && (
              <div className="w-full flex flex-col gap-3">
                <Skeleton className="h-[74px] w-full rounded-lg" />
                <Skeleton className="h-[74px] w-full rounded-lg" />
                <Skeleton className="h-[74px] w-full rounded-lg" />
              </div>
            )}

            {dataState === "empty" && (
              <div className="w-full border border-dashed border-zinc-200 rounded-lg p-8 flex flex-col items-center text-center gap-3">
                <AlertCircle className="h-10 w-10 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-950">No Wallets Detected</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[260px]">
                  Please install a Stellar wallet extension (e.g. Freighter, xBull, or Albedo) to connect your campus identity.
                </p>
              </div>
            )}

            {dataState === "loaded" && (
              <div className="w-full flex flex-col gap-3">
                {/* Freighter Option */}
                <button
                  onClick={() => handleConnectWallet()}
                  className="w-full bg-white border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 transition-all p-4 rounded-lg flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 font-bold text-sm">
                      F
                    </div>
                    <span className="text-base font-semibold text-zinc-950">Freighter</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
                </button>

                {/* xBull Option */}
                <button
                  onClick={() => handleConnectWallet()}
                  className="w-full bg-white border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 transition-all p-4 rounded-lg flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 font-bold text-sm">
                      X
                    </div>
                    <span className="text-base font-semibold text-zinc-950">xBull</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
                </button>

                {/* Albedo Option */}
                <button
                  onClick={() => handleConnectWallet()}
                  className="w-full bg-white border border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50 transition-all p-4 rounded-lg flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 font-bold text-sm">
                      A
                    </div>
                    <span className="text-base font-semibold text-zinc-950">Albedo</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── STATE B: ONBOARDING VIEW ─── */}
        {currentStep === "onboarding" && (
          <div className="w-full flex flex-col gap-6">
            
            {/* Header Section */}
            <div className="flex flex-col gap-1 items-center text-center">
              <h1 className="text-2xl font-semibold text-zinc-950">Complete your profile</h1>
              <p className="text-sm text-zinc-500">Setup your academic identity for the network.</p>
            </div>

            {dataState === "loading" && (
              <div className="w-full flex flex-col gap-4">
                <Skeleton className="h-[38px] w-full rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-[48px] w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-[48px] w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-[48px] w-full rounded-lg" />
                </div>
                <Skeleton className="h-[48px] w-full rounded-lg mt-4" />
              </div>
            )}

            {dataState === "empty" && (
              <div className="w-full border border-dashed border-zinc-200 rounded-lg p-8 flex flex-col items-center text-center gap-3">
                <AlertCircle className="h-10 w-10 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-950">No Details Allowed</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[260px]">
                  Academic onboarding is currently restricted. Please contact your university administrator.
                </p>
              </div>
            )}

            {dataState === "loaded" && (
              <div className="w-full flex flex-col gap-5">
                {/* Wallet Address Pill */}
                <div className="bg-zinc-50 rounded-full py-2 px-4 flex items-center justify-between border border-zinc-200">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500 font-mono tracking-wider">{mockAddress}</span>
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    aria-label="Copy wallet address"
                    className="text-zinc-500 hover:text-zinc-950 transition-colors flex items-center cursor-pointer p-0.5"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSubmitProfile} className="flex flex-col gap-4 w-full">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-zinc-950" htmlFor="fullName">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-body-md text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors placeholder:text-zinc-400"
                    />
                  </div>

                  {/* University ID */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-zinc-950" htmlFor="universityId">
                      University ID
                    </label>
                    <input
                      id="universityId"
                      type="text"
                      required
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-body-md text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Department Dropdown (Custom Dropdown component) */}
                  <Select
                    options={DEPARTMENTS}
                    value={department}
                    onChange={(val) => setDepartment(val)}
                    placeholder="Select Department"
                    label="Department"
                  />

                  {/* Email (Optional) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline">
                      <label className="text-sm font-semibold text-zinc-950" htmlFor="email">
                        Email Address
                      </label>
                      <span className="text-xs text-zinc-400">Optional</span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@university.edu"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-body-md text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Custom Toggle / Accept Terms */}
                  <CustomToggle
                    checked={acceptTerms}
                    onChange={(val) => setAcceptTerms(val)}
                    label="Accept Campus Terms of Use"
                    className="mt-2"
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!acceptTerms}
                    className="w-full bg-zinc-950 text-white font-semibold rounded-lg py-4 px-6 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </form>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-8 h-1 rounded-full bg-zinc-950"></div>
                  <div className="w-2 h-1 rounded-full bg-zinc-200"></div>
                  <div className="w-2 h-1 rounded-full bg-zinc-200"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STATE C: ONBOARDING SUCCESS VIEW ─── */}
        {currentStep === "success" && (
          <div className="w-full flex flex-col items-center gap-6 py-4">
            <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-950">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-zinc-950">Profile Registered</h2>
              <p className="text-sm text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                Welcome to CampusChain! Your campus identity has been registered successfully.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep("connect")}
              className="w-full bg-zinc-950 text-white font-semibold rounded-lg py-3.5 px-6 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <span>Done</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer fixed at bottom */}
      <footer className="fixed bottom-0 left-0 w-full p-6 flex flex-col sm:flex-row items-center justify-center gap-4 z-0 text-zinc-400">
        <div className="flex items-center gap-2 text-xs font-semibold select-none">
          <Lock className="h-4 w-4" />
          <span>Secured by the Stellar Network</span>
        </div>
        <div className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-semibold border border-zinc-200 select-none">
          Testnet
        </div>
      </footer>
    </div>
  );
}
export default Login;
