"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Copy,
  Lock,
  LogOut,
  RefreshCw,
  Wallet,
  GraduationCap,
  Store,
  Calendar,
  Building,
  Building2,
} from "lucide-react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS } from "@/shared/stellar/client";
import {
  fetchUniversities,
  fetchUniversity,
  type OnboardingRole,
  type UniversityRecord,
  UniversityApprovalStatus,
  fetchUniversityStudentIds,
  bufToHex,
} from "@/features/wallet/service/campusIdentity";
import {
  useRegisterProfileMutation,
  useRegisterUniversityMutation,
} from "@/features/wallet/hooks/useWallet";

interface LoginProps {
  showOnboarding?: boolean;
}

export function Login({ showOnboarding = false }: LoginProps) {
  const {
    connect,
    disconnect,
    isConnecting,
    error: walletError,
    wrongNetwork,
    address,
    isConnected,
  } = useWallet();
  const registerProfile = useRegisterProfileMutation();
  const registerUniversity = useRegisterUniversityMutation();

  // Multi-step Onboarding State (Step 1: Role, Step 2: Details, Step 3: Review)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<OnboardingRole>("Student");
  const [fullName, setFullName] = useState("");
  const [universityCode, setUniversityCode] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [universityAddress, setUniversityAddress] = useState("");
  const [adminTitle, setAdminTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [graduationYear, setGraduationYear] = useState(
    String(new Date().getFullYear() + 4)
  );
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [merchantCategory, setMerchantCategory] = useState("1");
  const [businessDescription, setBusinessDescription] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationDescription, setOrganizationDescription] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedState, setSubmittedState] = useState<
    "university" | "profile" | null
  >(null);
  const [copied, setCopied] = useState(false);
  const [debouncedCode, setDebouncedCode] = useState("");
  const isPlatformAdmin = Boolean(
    address && address === NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS
  );

  const universities = useQuery({
    queryKey: ["universities"],
    queryFn: () => fetchUniversities(address ?? undefined),
    enabled: showOnboarding && !isPlatformAdmin,
    refetchInterval: 20_000,
  });
  const approvedUniversities = useMemo(
    () =>
      (universities.data ?? []).filter(
        (u) => u.approvalStatus === UniversityApprovalStatus.Approved
      ),
    [universities.data]
  );
  const normalizedCode = universityCode.trim().toUpperCase();
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedCode(normalizedCode), 350);
    return () => window.clearTimeout(id);
  }, [normalizedCode]);
  const availability = useQuery({
    queryKey: ["university-availability", debouncedCode],
    queryFn: () => fetchUniversity(debouncedCode, address ?? undefined),
    enabled: role === "UniversityAdmin" && debouncedCode.length >= 2,
    staleTime: 0,
  });

  const pending =
    isConnecting || registerProfile.isPending || registerUniversity.isPending;

  const copyAddress = () => {
    if (!address) return;
    void navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };

  const selectedUniversityName = useMemo(() => {
    if (role === "UniversityAdmin") return universityName || normalizedCode || "New University";
    const match = approvedUniversities.find((u) => u.code === universityCode);
    return match ? `${match.name} (${match.code})` : universityCode || "None selected";
  }, [approvedUniversities, universityCode, role, universityName, normalizedCode]);

  function validateStep2(): boolean {
    setFormError(null);
    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return false;
    }
    if (role === "UniversityAdmin") {
      if (!normalizedCode || !universityName.trim() || !universityAddress.trim() || !adminTitle.trim()) {
        setFormError("Please complete all university details.");
        return false;
      }
      if (availability.data) {
        setFormError("This university code is already registered.");
        return false;
      }
    } else {
      if (!universityCode) {
        setFormError("Please choose an approved university campus.");
        return false;
      }
      if (role === "Student") {
        if (!department.trim() || !program.trim() || !studentIdentifier.trim()) {
          setFormError("Please complete your department, program, and student ID.");
          return false;
        }
        const gradNum = Number(graduationYear);
        if (isNaN(gradNum) || gradNum < 2020 || gradNum > 2040) {
          setFormError("Please enter a valid graduation year.");
          return false;
        }
      } else if (role === "Merchant") {
        if (!businessName.trim() || !businessDescription.trim()) {
          setFormError("Please complete your business name and description.");
          return false;
        }
      } else if (role === "EventOrganizer") {
        if (!organizationName.trim() || !organizationDescription.trim()) {
          setFormError("Please complete your club/organization details.");
          return false;
        }
      }
    }
    return true;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!address || !fullName.trim() || !acceptTerms) {
      return setFormError(
        "Enter your name and accept the Campus Terms of Use."
      );
    }
    try {
      if (role === "UniversityAdmin") {
        if (
          !normalizedCode ||
          !universityName.trim() ||
          !universityAddress.trim() ||
          !adminTitle.trim()
        ) {
          throw new globalThis.Error("Complete all university fields.");
        }
        if (availability.data) {
          throw new globalThis.Error("This university code is already taken.");
        }
        await registerUniversity.mutateAsync({
          admin: address,
          code: normalizedCode,
          name: universityName.trim(),
          address: universityAddress.trim(),
          title: adminTitle.trim(),
        });
        setSubmittedState("university");
        return;
      }
      if (!universityCode) {
        throw new globalThis.Error("Choose an approved university.");
      }
      if (role === "Student") {
        if (
          !department.trim() ||
          !program.trim() ||
          !studentIdentifier.trim()
        ) {
          throw new globalThis.Error("Complete your student details.");
        }
        const digest = new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(studentIdentifier.trim())
              .buffer as ArrayBuffer
          )
        );
        const currentHashHex = bufToHex(digest);
        const existingHashes = await fetchUniversityStudentIds(
          universityCode,
          address
        );
        if (existingHashes.includes(currentHashHex)) {
          throw new globalThis.Error(
            "This Student ID is already registered at this university."
          );
        }
        await registerProfile.mutateAsync({
          address,
          fullName: fullName.trim(),
          universityCode,
          registration: {
            role,
            department: department.trim(),
            program: program.trim(),
            graduationYear: Number(graduationYear),
            studentIdentifier: studentIdentifier.trim(),
          },
        });
        if (address) {
          localStorage.setItem(
            `campus_student_id_${address}`,
            studentIdentifier.trim()
          );
        }
      } else if (role === "Merchant") {
        if (!businessName.trim() || !businessDescription.trim()) {
          throw new globalThis.Error("Complete your business details.");
        }
        await registerProfile.mutateAsync({
          address,
          fullName: fullName.trim(),
          universityCode,
          registration: {
            role,
            businessName: businessName.trim(),
            category: Number(merchantCategory),
            businessDescription: businessDescription.trim(),
          },
        });
      } else {
        if (!organizationName.trim() || !organizationDescription.trim()) {
          throw new globalThis.Error("Complete your organization details.");
        }
        await registerProfile.mutateAsync({
          address,
          fullName: fullName.trim(),
          universityCode,
          registration: {
            role,
            organizationName: organizationName.trim(),
            organizationDescription: organizationDescription.trim(),
          },
        });
      }
      setSubmittedState("profile");
    } catch (error) {
      setFormError(
        error instanceof globalThis.Error
          ? error.message
          : "Profile registration failed."
      );
    }
  }

  if (isConnected && wrongNetwork) {
    return (
      <Guard
        title="Wrong Network Detected"
        message="CampusChain runs on Stellar Testnet. Switch your wallet to Testnet and reconnect."
        onSwitchWallet={() => void connect()}
        onDisconnect={() => void disconnect()}
      />
    );
  }
  if (submittedState === "university") {
    return (
      <PendingState
        university
        address={address ?? undefined}
        universityCode={normalizedCode}
        onChangeWallet={() => void connect()}
        onDisconnect={() => void disconnect()}
      />
    );
  }
  if (submittedState === "profile") {
    return (
      <PendingState
        address={address ?? undefined}
        universityCode={universityCode}
        role={role}
        onChangeWallet={() => void connect()}
        onDisconnect={() => void disconnect()}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground flex items-center justify-center p-3 sm:p-6 transition-colors">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle variant="compact" />
      </div>
      <main className="w-full max-w-md sm:max-w-lg md:max-w-xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 sm:p-7 md:p-8 shadow-sm transition-all">
        {!showOnboarding ? (
          <div className="space-y-6 text-center max-w-md mx-auto py-2">
            <div className="flex items-center justify-center gap-3">
              <Image
                src="/icon.png"
                alt="CampusChain Logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-contain dark:invert transition-[filter] duration-150"
              />
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">CampusChain</h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your decentralized campus platform for student IDs, marketplace escrow, canteen ordering, events, and scholarships on Stellar.
            </p>
            <button
              onClick={() => void connect()}
              disabled={pending}
              className="w-full rounded-xl bg-foreground px-6 py-3.5 sm:py-4 font-semibold text-background hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <Wallet className="size-4" />
              <span>Connect Stellar Wallet</span>
              <ArrowRight className="size-4" />
            </button>
            {walletError && <Error message={walletError} />}
          </div>
        ) : isPlatformAdmin ? (
          <div className="py-8 text-center">
            <BadgeCheck className="mx-auto size-12 text-emerald-600 dark:text-emerald-400" />
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              Platform Admin Detected
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Platform Admin profile is provisioned on-chain. Opening dashboard…
            </p>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {/* Header & Step Indicator */}
            <header className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    Complete your profile
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Step {step} of 3 • {step === 1 ? "Choose your role" : step === 2 ? "Campus & identity details" : "Review & submit"}
                  </p>
                </div>
                {/* Stepper Dots */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        s === step
                          ? "w-6 bg-zinc-600 dark:bg-zinc-300"
                          : s < step
                          ? "w-2 bg-emerald-500"
                          : "w-2 bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {address && (
                <WalletPill
                  address={address}
                  copied={copied}
                  onCopy={copyAddress}
                  onChangeWallet={() => void connect()}
                  onDisconnect={() => void disconnect()}
                  disabled={pending}
                />
              )}
            </header>

            {(formError || walletError) && (
              <Error message={formError || walletError || ""} />
            )}

            {pending ? (
              <div className="space-y-3 py-6">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5 sm:space-y-6">
                {/* STEP 1: ROLE SELECTION */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <RoleCard
                        selected={role === "Student"}
                        onSelect={() => {
                          setRole("Student");
                          setUniversityCode("");
                        }}
                        title="Student"
                        icon={<GraduationCap className="size-4.5 text-sky-500" />}
                        badge="CAMP Faucet & Pay"
                        description="Access marketplace escrow, canteen food ordering, events & scholarships."
                      />
                      <RoleCard
                        selected={role === "Merchant"}
                        onSelect={() => {
                          setRole("Merchant");
                          setUniversityCode("");
                        }}
                        title="Campus Merchant"
                        icon={<Store className="size-4.5 text-emerald-500" />}
                        badge="Orders & Menu"
                        description="Accept CAMP tokens, manage canteen menus, and fulfill student orders."
                      />
                      <RoleCard
                        selected={role === "EventOrganizer"}
                        onSelect={() => {
                          setRole("EventOrganizer");
                          setUniversityCode("");
                        }}
                        title="Event Organizer"
                        icon={<Calendar className="size-4.5 text-indigo-500" />}
                        badge="Tickets & Clubs"
                        description="Publish campus events, sell NFT tickets, and manage admissions."
                      />
                      <RoleCard
                        selected={role === "UniversityAdmin"}
                        onSelect={() => {
                          setRole("UniversityAdmin");
                          setUniversityCode("");
                        }}
                        title="University Admin"
                        icon={<Building className="size-4.5 text-amber-500" />}
                        badge="Campus Admin"
                        description="Register campus, verify students, and oversee scholarship programs."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full rounded-xl bg-foreground px-5 py-3.5 font-semibold text-background hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
                    >
                      <span>Continue with {role === "UniversityAdmin" ? "University Admin" : role}</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: DETAILS & CAMPUS INFO */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Field label="Full Legal Name">
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input"
                        placeholder="e.g. Alex Morgan"
                        required
                      />
                    </Field>

                    {role === "UniversityAdmin" ? (
                      <UniversityAdminFields
                        code={universityCode}
                        setCode={(value) =>
                          setUniversityCode(value.toUpperCase())
                        }
                        availability={availability}
                        name={universityName}
                        setName={setUniversityName}
                        address={universityAddress}
                        setAddress={setUniversityAddress}
                        title={adminTitle}
                        setTitle={setAdminTitle}
                      />
                    ) : (
                      <ScopedFields
                        role={role}
                        universityCode={universityCode}
                        setUniversityCode={setUniversityCode}
                        approvedUniversities={approvedUniversities}
                        loadingUniversities={universities.isLoading}
                        department={department}
                        setDepartment={setDepartment}
                        program={program}
                        setProgram={setProgram}
                        graduationYear={graduationYear}
                        setGraduationYear={setGraduationYear}
                        studentIdentifier={studentIdentifier}
                        setStudentIdentifier={setStudentIdentifier}
                        businessName={businessName}
                        setBusinessName={setBusinessName}
                        merchantCategory={merchantCategory}
                        setMerchantCategory={setMerchantCategory}
                        businessDescription={businessDescription}
                        setBusinessDescription={setBusinessDescription}
                        organizationName={organizationName}
                        setOrganizationName={setOrganizationName}
                        organizationDescription={organizationDescription}
                        setOrganizationDescription={setOrganizationDescription}
                      />
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/3 rounded-xl border border-border bg-card px-4 py-3 font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all text-xs cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep2()) setStep(3);
                        }}
                        className="w-2/3 rounded-xl bg-foreground px-5 py-3 font-semibold text-background hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
                      >
                        <span>Review Profile</span>
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & CONFIRM */}
                {step === 3 && (
                  <div className="space-y-4">
                    {/* Summary Identity Card */}
                    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity Summary</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200/70 dark:bg-zinc-800 text-foreground border border-zinc-300/80 dark:border-zinc-700">
                          {role}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Name</span>
                          <span className="font-semibold text-foreground">{fullName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Campus</span>
                          <span className="font-semibold text-foreground">{selectedUniversityName}</span>
                        </div>

                        {role === "Student" && (
                          <>
                            <div>
                              <span className="text-muted-foreground block">Department / Program</span>
                              <span className="font-medium text-foreground">{department} · {program}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Graduation Year</span>
                              <span className="font-medium text-foreground">{graduationYear}</span>
                            </div>
                          </>
                        )}

                        {role === "Merchant" && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Business</span>
                            <span className="font-medium text-foreground">{businessName}</span>
                          </div>
                        )}

                        {role === "EventOrganizer" && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Organization</span>
                            <span className="font-medium text-foreground">{organizationName}</span>
                          </div>
                        )}

                        {role === "UniversityAdmin" && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Administrator Title</span>
                            <span className="font-medium text-foreground">{adminTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="flex items-start gap-3 text-xs text-muted-foreground cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 rounded border-border text-foreground focus:ring-foreground"
                      />
                      <span>
                        I agree to the <span className="underline text-foreground">CampusChain Terms of Service</span> and acknowledge that my profile will be registered on the Stellar network.
                      </span>
                    </label>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-1/3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-card px-4 py-3.5 font-semibold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-xs cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={!acceptTerms || pending}
                        className="w-2/3 rounded-xl bg-foreground px-5 py-3.5 font-semibold text-background hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2 text-sm"
                      >
                        {pending ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="size-4 animate-spin" />
                            <span>Submitting on-chain…</span>
                          </div>
                        ) : (
                          <>
                            <span>Submit for {role === "UniversityAdmin" ? "Approval" : "Verification"}</span>
                            <ArrowRight className="size-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        <footer className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground/70 border-t border-zinc-200/80 dark:border-zinc-800 pt-4">
          <Lock className="size-3.5" />
          <span>Secured on Stellar Testnet</span>
        </footer>
      </main>
    </div>
  );
}

function RoleCard({
  selected,
  onSelect,
  title,
  icon,
  badge,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl border p-3.5 sm:p-4 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between gap-2.5 ${
        selected
          ? "border-zinc-300 dark:border-zinc-700 bg-zinc-100/60 dark:bg-zinc-800/40 shadow-xs ring-1 ring-zinc-300/80 dark:ring-zinc-700/80"
          : "border-zinc-200/80 dark:border-zinc-800 bg-card hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`size-8 sm:size-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
            selected
              ? "bg-card border-zinc-300 dark:border-zinc-700"
              : "bg-background border-zinc-200/80 dark:border-zinc-800"
          }`}>
            {icon}
          </div>
          <span className="font-semibold text-xs sm:text-sm text-foreground truncate">{title}</span>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap transition-colors ${
          selected
            ? "bg-zinc-200/80 dark:bg-zinc-700/70 text-foreground border-zinc-300 dark:border-zinc-600"
            : "bg-muted/80 text-muted-foreground border-zinc-200/70 dark:border-zinc-800"
        }`}>
          {badge}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

type SetString = (value: string) => void;
interface ScopedFieldsProps {
  role: Exclude<OnboardingRole, "UniversityAdmin">;
  universityCode: string;
  setUniversityCode: SetString;
  approvedUniversities: UniversityRecord[];
  loadingUniversities: boolean;
  department: string;
  setDepartment: SetString;
  program: string;
  setProgram: SetString;
  graduationYear: string;
  setGraduationYear: SetString;
  studentIdentifier: string;
  setStudentIdentifier: SetString;
  businessName: string;
  setBusinessName: SetString;
  merchantCategory: string;
  setMerchantCategory: SetString;
  businessDescription: string;
  setBusinessDescription: SetString;
  organizationName: string;
  setOrganizationName: SetString;
  organizationDescription: string;
  setOrganizationDescription: SetString;
}

function ScopedFields(props: ScopedFieldsProps) {
  const { role } = props;

  return (
    <>
      <Field label="University">
        {props.loadingUniversities ? (
          <div className="h-10 w-full rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground animate-pulse flex items-center">
            Loading approved universities…
          </div>
        ) : (
          <Dropdown<string>
            options={[
              {
                value: "",
                label: "Choose an approved university",
                icon: <AlertCircle className="h-4.5 w-4.5 text-muted-foreground" />,
              },
              ...props.approvedUniversities.map((u) => ({
                value: u.code,
                label: `${u.name} (${u.code})`,
                icon: <Building2 className="h-4.5 w-4.5 text-sky-500" />,
              })),
            ]}
            value={props.universityCode}
            onChange={props.setUniversityCode}
          />
        )}
      </Field>

      {role === "Student" && (
        <>
          <Field label="Department">
            <input
              className="input"
              value={props.department}
              onChange={(e) => props.setDepartment(e.target.value)}
            />
          </Field>
          <Field label="Program">
            <input
              className="input"
              value={props.program}
              onChange={(e) => props.setProgram(e.target.value)}
            />
          </Field>
          <Field label="Graduation year">
            <input
              className="input"
              type="number"
              value={props.graduationYear}
              onChange={(e) => props.setGraduationYear(e.target.value)}
            />
          </Field>
          <Field label="Student ID">
            <input
              className="input"
              value={props.studentIdentifier}
              onChange={(e) => props.setStudentIdentifier(e.target.value)}
            />
          </Field>
        </>
      )}

      {role === "Merchant" && (
        <>
          <Field label="Business name">
            <input
              className="input"
              value={props.businessName}
              onChange={(e) => props.setBusinessName(e.target.value)}
            />
          </Field>
          <Field label="Category">
            <Dropdown<string>
              options={[
                {
                  value: "1",
                  label: "Retail",
                  icon: <Store className="h-4.5 w-4.5 text-blue-500" />,
                },
                {
                  value: "2",
                  label: "Food / Canteen",
                  icon: <Store className="h-4.5 w-4.5 text-emerald-500" />,
                },
                {
                  value: "3",
                  label: "Services",
                  icon: <Store className="h-4.5 w-4.5 text-indigo-500" />,
                },
                {
                  value: "4",
                  label: "Other",
                  icon: <Store className="h-4.5 w-4.5 text-zinc-500" />,
                },
              ]}
              value={props.merchantCategory}
              onChange={props.setMerchantCategory}
            />
          </Field>
          <Field label="Business description">
            <textarea
              className="input"
              value={props.businessDescription}
              onChange={(e) => props.setBusinessDescription(e.target.value)}
            />
          </Field>
        </>
      )}

      {role === "EventOrganizer" && (
        <>
          <Field label="Club / organization name">
            <input
              className="input"
              value={props.organizationName}
              onChange={(e) => props.setOrganizationName(e.target.value)}
            />
          </Field>
          <Field label="Organization description">
            <textarea
              className="input"
              value={props.organizationDescription}
              onChange={(e) =>
                props.setOrganizationDescription(e.target.value)
              }
            />
          </Field>
        </>
      )}
    </>
  );
}

interface UniversityAdminFieldsProps {
  code: string;
  setCode: SetString;
  availability: { data?: UniversityRecord | null; isFetching: boolean };
  name: string;
  setName: SetString;
  address: string;
  setAddress: SetString;
  title: string;
  setTitle: SetString;
}

function UniversityAdminFields(props: UniversityAdminFieldsProps) {
  const availabilityText =
    props.code.length < 2
      ? "Enter 2–32 uppercase characters."
      : props.availability.isFetching
      ? "Checking availability…"
      : props.availability.data
      ? "Already taken"
      : "Available";

  return (
    <>
      <Field label="University code">
        <input
          className="input uppercase"
          value={props.code}
          onChange={(e) => props.setCode(e.target.value)}
          placeholder=""
          required
        />
        <p
          className={`text-xs ${
            props.availability.data ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {availabilityText}
        </p>
      </Field>
      <Field label="University name">
        <input
          className="input"
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
          required
        />
      </Field>
      <Field label="University address">
        <textarea
          className="input"
          value={props.address}
          onChange={(e) => props.setAddress(e.target.value)}
          required
        />
      </Field>
      <Field label="Your title">
        <input
          className="input"
          value={props.title}
          onChange={(e) => props.setTitle(e.target.value)}
          placeholder="Registrar"
          required
        />
      </Field>
    </>
  );
}

interface WalletPillProps {
  address: string;
  copied: boolean;
  onCopy: () => void;
  onChangeWallet?: () => void;
  onDisconnect?: () => void;
  disabled?: boolean;
}

function WalletPill({
  address,
  copied,
  onCopy,
  onChangeWallet,
  onDisconnect,
  disabled = false,
}: WalletPillProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-2.5 text-xs text-muted-foreground shadow-2xs">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card border border-zinc-200/80 dark:border-zinc-800">
          <Wallet className="size-3.5 text-foreground" />
        </div>
        <span className="font-mono font-medium text-foreground text-xs truncate">
          {address.slice(0, 6)}…{address.slice(-6)}
        </span>
        <button
          type="button"
          onClick={onCopy}
          title={copied ? "Copied" : "Copy address"}
          aria-label="Copy wallet address"
          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-1.5 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200/80 dark:border-zinc-800 shrink-0">
        {onChangeWallet && (
          <button
            type="button"
            onClick={onChangeWallet}
            disabled={disabled}
            title="Change connected wallet"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-card hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="size-3" />
            <span>Change</span>
          </button>
        )}
        {onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disabled}
            title="Disconnect wallet"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="size-3" />
            <span>Disconnect</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold text-foreground">
      {label}
      {children}
    </label>
  );
}

function Error({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 break-words whitespace-pre-wrap max-h-60 overflow-y-auto">
      {message}
    </p>
  );
}

function Guard({
  title,
  message,
  onDisconnect,
  onSwitchWallet,
}: {
  title: string;
  message: string;
  onDisconnect?: () => void;
  onSwitchWallet?: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background text-foreground p-6 transition-colors">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle variant="compact" />
      </div>
      <div className="max-w-md w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-6 sm:p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto size-10 text-red-600" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          {onSwitchWallet && (
            <button
              onClick={onSwitchWallet}
              className="w-full rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer"
            >
              Switch Wallet
            </button>
          )}
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="w-full rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export function PendingState({
  university = false,
  address,
  universityCode,
  role,
  onDisconnect,
  onChangeWallet,
}: {
  university?: boolean;
  address?: string;
  universityCode?: string;
  role?: string;
  onDisconnect?: () => void;
  onChangeWallet?: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>("just now");

  const handleCheckStatus = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setLastChecked("just now");
      window.location.reload();
    }, 1200);
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-background text-foreground p-4 sm:p-6 transition-colors">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle variant="compact" />
      </div>
      <div className="max-w-md sm:max-w-lg w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 sm:p-8 text-center shadow-sm space-y-6">
        {/* Animated Badge */}
        <div className="relative mx-auto size-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Clock3 className="size-7 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {university
              ? "Awaiting Platform Admin Approval"
              : "Verification Pending"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {university
              ? "Your university claim is registered on-chain. Platform administrators review and approve new university campuses."
              : `Your ${role || "student"} profile was submitted on-chain for campus ${universityCode || "verification"}. Your University Registrar must approve it to unlock campus privileges.`}
          </p>
        </div>

        {/* 3-Stage Progress Stepper */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 text-left space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="size-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Check className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Stellar Wallet Connected</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {address ? `${address.slice(0, 8)}...${address.slice(-8)}` : "Verified Keypair"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="size-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Check className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">On-Chain Identity Recorded</p>
              <p className="text-[11px] text-muted-foreground">
                Registered to Campus Identity Soroban Contract
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="size-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <RefreshCw className="size-3 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {university ? "Platform Admin Review" : "University Admin Review"}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Pending on-chain verification
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Action Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking on-chain…" : "Check Status Now"}</span>
          </button>

          {onChangeWallet && (
            <button
              type="button"
              onClick={onChangeWallet}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-card text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Wallet className="size-3.5" />
              <span>Change Wallet</span>
            </button>
          )}

          {onDisconnect && (
            <button
              type="button"
              onClick={onDisconnect}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Disconnect</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/70">
          Last checked {lastChecked}. Features unlock automatically upon approval.
        </p>
      </div>
    </main>
  );
}

export default Login;
