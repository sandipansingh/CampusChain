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
        onChangeWallet={() => void connect()}
        onDisconnect={() => void disconnect()}
      />
    );
  }
  if (submittedState === "profile") {
    return (
      <PendingState
        onChangeWallet={() => void connect()}
        onDisconnect={() => void disconnect()}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6 transition-colors">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle variant="compact" />
      </div>
      <main className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        {!showOnboarding ? (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Image
                src="/icon.png"
                alt="CampusChain Logo"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain"
              />
              <h1 className="text-4xl font-bold">CampusChain</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Your campus wallet for payments, marketplace, events and
              scholarships.
            </p>
            <button
              onClick={() => void connect()}
              disabled={pending}
              className="w-full rounded-lg bg-foreground px-6 py-4 font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              Connect Stellar Wallet{" "}
              <ArrowRight className="ml-2 inline size-4" />
            </button>
            {walletError && <Error message={walletError} />}
          </div>
        ) : isPlatformAdmin ? (
          <div className="py-8 text-center">
            <BadgeCheck className="mx-auto size-10 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-semibold">
              Platform Admin detected
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your immutable Platform Admin profile is already provisioned.
              Opening the dashboard…
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <header className="text-center">
              <h1 className="text-2xl font-semibold">Complete your profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up your university-scoped CampusChain identity.
              </p>
            </header>
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
            {(formError || walletError) && (
              <Error message={formError || walletError || ""} />
            )}
            {pending ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <Field label="Role">
                  <Dropdown<OnboardingRole>
                    options={[
                      {
                        value: "Student",
                        label: "Student",
                        icon: (
                          <GraduationCap className="h-4.5 w-4.5 text-sky-500" />
                        ),
                      },
                      {
                        value: "Merchant",
                        label: "Merchant",
                        icon: <Store className="h-4.5 w-4.5 text-emerald-500" />,
                      },
                      {
                        value: "EventOrganizer",
                        label: "Event Organizer",
                        icon: (
                          <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                        ),
                      },
                      {
                        value: "UniversityAdmin",
                        label: "University Admin",
                        icon: <Building className="h-4.5 w-4.5 text-amber-500" />,
                      },
                    ]}
                    value={role}
                    onChange={(val) => {
                      setRole(val);
                      setUniversityCode("");
                    }}
                  />
                </Field>
                <Field label="Full name">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    placeholder=""
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
                <label className="flex gap-3 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  Accept Campus Terms of Use
                </label>
                <button
                  disabled={!acceptTerms}
                  className="w-full rounded-lg bg-zinc-950 px-6 py-4 font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Submit for{" "}
                  {role === "UniversityAdmin" ? "approval" : "verification"}{" "}
                  <ArrowRight className="ml-2 inline size-4" />
                </button>
              </form>
            )}
          </div>
        )}
        <footer className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 border-t border-zinc-100 pt-4">
          <Lock className="size-4" />
          Secured by Stellar Testnet
        </footer>
      </main>
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card border border-border">
          <Wallet className="size-3.5 text-foreground" />
        </div>
        <span className="font-mono font-medium text-foreground">
          {address.slice(0, 6)}…{address.slice(-6)}
        </span>
        <button
          type="button"
          onClick={onCopy}
          title={copied ? "Copied" : "Copy address"}
          aria-label="Copy wallet address"
          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-1.5 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
        {onChangeWallet && (
          <button
            type="button"
            onClick={onChangeWallet}
            disabled={disabled}
            title="Change connected wallet"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-card hover:bg-muted border border-border text-foreground transition-colors cursor-pointer disabled:opacity-50"
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
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
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto size-10 text-red-600" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          {onSwitchWallet && (
            <button
              onClick={onSwitchWallet}
              className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-opacity cursor-pointer"
            >
              Switch Wallet
            </button>
          )}
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
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
  onDisconnect,
  onChangeWallet,
}: {
  university?: boolean;
  onDisconnect?: () => void;
  onChangeWallet?: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background text-foreground p-6 transition-colors">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle variant="compact" />
      </div>
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <Clock3 className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          {university
            ? "Awaiting Platform Admin Approval"
            : "Verification Pending"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {university
            ? "Your university claim is recorded on-chain but remains unavailable until the Platform Admin approves it. Dashboard access is locked until then."
            : "Your profile was submitted on-chain. Your University Admin must verify it before campus actions and dashboard access are unlocked."}
        </p>
        {(onChangeWallet || onDisconnect) && (
          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-3">
            {onChangeWallet && (
              <button
                type="button"
                onClick={onChangeWallet}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3" />
                Change Wallet
              </button>
            )}
            {onDisconnect && (
              <button
                type="button"
                onClick={onDisconnect}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="size-3" />
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Login;
