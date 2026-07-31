"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, BadgeCheck, Check, Clock3, Copy, Lock, Wallet, GraduationCap, Store, Calendar, Building, Building2 } from "lucide-react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
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
import { useRegisterProfileMutation, useRegisterUniversityMutation } from "@/features/wallet/hooks/useWallet";

interface LoginProps { showOnboarding?: boolean; }

export function Login({ showOnboarding = false }: LoginProps) {
  const { connect, isConnecting, error: walletError, wrongNetwork, address, isConnected } = useWallet();
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
  const [graduationYear, setGraduationYear] = useState(String(new Date().getFullYear() + 4));
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [merchantCategory, setMerchantCategory] = useState("1");
  const [businessDescription, setBusinessDescription] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationDescription, setOrganizationDescription] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedState, setSubmittedState] = useState<"university" | "profile" | null>(null);
  const [copied, setCopied] = useState(false);
  const [debouncedCode, setDebouncedCode] = useState("");
  const isPlatformAdmin = Boolean(address && address === NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS);

  const universities = useQuery({ queryKey: ["universities"], queryFn: () => fetchUniversities(address ?? undefined), enabled: showOnboarding && !isPlatformAdmin, refetchInterval: 20_000 });
  const approvedUniversities = useMemo(() => (universities.data ?? []).filter((u) => u.approvalStatus === UniversityApprovalStatus.Approved), [universities.data]);
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

  const pending = isConnecting || registerProfile.isPending || registerUniversity.isPending;
  const copyAddress = () => { if (!address) return; void navigator.clipboard.writeText(address); setCopied(true); window.setTimeout(() => setCopied(false), 2_000); };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!address || !fullName.trim() || !acceptTerms) return setFormError("Enter your name and accept the Campus Terms of Use.");
    try {
      if (role === "UniversityAdmin") {
        if (!normalizedCode || !universityName.trim() || !universityAddress.trim() || !adminTitle.trim()) throw new globalThis.Error("Complete all university fields.");
        if (availability.data) throw new globalThis.Error("This university code is already taken.");
        await registerUniversity.mutateAsync({ admin: address, code: normalizedCode, name: universityName.trim(), address: universityAddress.trim(), title: adminTitle.trim() });
        setSubmittedState("university");
        return;
      }
      if (!universityCode) throw new globalThis.Error("Choose an approved university.");
      if (role === "Student") {
        if (!department.trim() || !program.trim() || !studentIdentifier.trim()) throw new globalThis.Error("Complete your student details.");
        const digest = new Uint8Array(await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(studentIdentifier.trim()).buffer as ArrayBuffer
        ));
        const currentHashHex = bufToHex(digest);
        const existingHashes = await fetchUniversityStudentIds(universityCode, address);
        if (existingHashes.includes(currentHashHex)) {
          throw new globalThis.Error("This Student ID is already registered at this university.");
        }
        await registerProfile.mutateAsync({ address, fullName: fullName.trim(), universityCode, registration: { role, department: department.trim(), program: program.trim(), graduationYear: Number(graduationYear), studentIdentifier: studentIdentifier.trim() } });
        if (address) {
          localStorage.setItem(`campus_student_id_${address}`, studentIdentifier.trim());
        }
      } else if (role === "Merchant") {
        if (!businessName.trim() || !businessDescription.trim()) throw new globalThis.Error("Complete your business details.");
        await registerProfile.mutateAsync({ address, fullName: fullName.trim(), universityCode, registration: { role, businessName: businessName.trim(), category: Number(merchantCategory), businessDescription: businessDescription.trim() } });
      } else {
        if (!organizationName.trim() || !organizationDescription.trim()) throw new globalThis.Error("Complete your organization details.");
        await registerProfile.mutateAsync({ address, fullName: fullName.trim(), universityCode, registration: { role, organizationName: organizationName.trim(), organizationDescription: organizationDescription.trim() } });
      }
      setSubmittedState("profile");
    } catch (error) { setFormError(error instanceof globalThis.Error ? error.message : "Profile registration failed."); }
  }

  if (isConnected && wrongNetwork) return <Guard title="Wrong Network Detected" message="CampusChain runs on Stellar Testnet. Switch your wallet to Testnet and reconnect." />;
  if (submittedState === "university") return <PendingState university />;
  if (submittedState === "profile") return <PendingState />;

  return <div className="min-h-screen w-full bg-[#F7F7F5] text-zinc-950 flex items-center justify-center p-6"><main className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
    {!showOnboarding ? <div className="space-y-6 text-center"><h1 className="text-4xl font-bold">CampusChain</h1><p className="text-sm text-zinc-500">Your campus wallet for payments, marketplace, events and rewards.</p><button onClick={() => void connect()} disabled={pending} className="w-full rounded-lg bg-zinc-950 px-6 py-4 font-semibold text-white disabled:opacity-50">Connect Stellar Wallet <ArrowRight className="ml-2 inline size-4" /></button>{walletError && <Error message={walletError} />}</div> : isPlatformAdmin ? <div className="py-8 text-center"><BadgeCheck className="mx-auto size-10 text-emerald-600" /><h1 className="mt-4 text-2xl font-semibold">Platform Admin detected</h1><p className="mt-2 text-sm text-zinc-500">Your immutable Platform Admin profile is already provisioned. Opening the dashboard…</p></div> : <div className="space-y-5"><header className="text-center"><h1 className="text-2xl font-semibold">Complete your profile</h1><p className="mt-1 text-sm text-zinc-500">Set up your university-scoped CampusChain identity.</p></header>{address && <WalletPill address={address} copied={copied} onCopy={copyAddress} />}{(formError || walletError) && <Error message={formError || walletError || ""} />}{pending ? <Skeleton className="h-52 w-full" /> : <form onSubmit={submit} className="space-y-4">
      <Field label="Role">
        <Dropdown<OnboardingRole>
          options={[
            { value: "Student", label: "Student", icon: <GraduationCap className="h-4.5 w-4.5 text-sky-500" /> },
            { value: "Merchant", label: "Merchant", icon: <Store className="h-4.5 w-4.5 text-emerald-500" /> },
            { value: "EventOrganizer", label: "Event Organizer", icon: <Calendar className="h-4.5 w-4.5 text-indigo-500" /> },
            { value: "UniversityAdmin", label: "University Admin", icon: <Building className="h-4.5 w-4.5 text-amber-500" /> },
          ]}
          value={role}
          onChange={(val) => {
            setRole(val);
            setUniversityCode("");
          }}
        />
      </Field>
      <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="" required /></Field>{role === "UniversityAdmin" ? <UniversityAdminFields code={universityCode} setCode={(value) => setUniversityCode(value.toUpperCase())} availability={availability} name={universityName} setName={setUniversityName} address={universityAddress} setAddress={setUniversityAddress} title={adminTitle} setTitle={setAdminTitle} /> : <ScopedFields role={role} universityCode={universityCode} setUniversityCode={setUniversityCode} approvedUniversities={approvedUniversities} loadingUniversities={universities.isLoading} department={department} setDepartment={setDepartment} program={program} setProgram={setProgram} graduationYear={graduationYear} setGraduationYear={setGraduationYear} studentIdentifier={studentIdentifier} setStudentIdentifier={setStudentIdentifier} businessName={businessName} setBusinessName={setBusinessName} merchantCategory={merchantCategory} setMerchantCategory={setMerchantCategory} businessDescription={businessDescription} setBusinessDescription={setBusinessDescription} organizationName={organizationName} setOrganizationName={setOrganizationName} organizationDescription={organizationDescription} setOrganizationDescription={setOrganizationDescription} />}<label className="flex gap-3 text-sm text-zinc-600"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />Accept Campus Terms of Use</label><button disabled={!acceptTerms} className="w-full rounded-lg bg-zinc-950 px-6 py-4 font-semibold text-white disabled:opacity-50">Submit for {role === "UniversityAdmin" ? "approval" : "verification"} <ArrowRight className="ml-2 inline size-4" /></button></form>}</div>}
    <footer className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 border-t border-zinc-100 pt-4"><Lock className="size-4" />Secured by Stellar Testnet</footer>
    </main></div>;
}

type SetString = (value: string) => void;
interface ScopedFieldsProps { role: Exclude<OnboardingRole, "UniversityAdmin">; universityCode: string; setUniversityCode: SetString; approvedUniversities: UniversityRecord[]; loadingUniversities: boolean; department: string; setDepartment: SetString; program: string; setProgram: SetString; graduationYear: string; setGraduationYear: SetString; studentIdentifier: string; setStudentIdentifier: SetString; businessName: string; setBusinessName: SetString; merchantCategory: string; setMerchantCategory: SetString; businessDescription: string; setBusinessDescription: SetString; organizationName: string; setOrganizationName: SetString; organizationDescription: string; setOrganizationDescription: SetString; }
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
              { value: "", label: "Choose an approved university", icon: <AlertCircle className="h-4.5 w-4.5 text-muted-foreground" /> },
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
            <input className="input" value={props.department} onChange={(e) => props.setDepartment(e.target.value)} />
          </Field>
          <Field label="Program">
            <input className="input" value={props.program} onChange={(e) => props.setProgram(e.target.value)} />
          </Field>
          <Field label="Graduation year">
            <input className="input" type="number" value={props.graduationYear} onChange={(e) => props.setGraduationYear(e.target.value)} />
          </Field>
          <Field label="Student ID">
            <input className="input" value={props.studentIdentifier} onChange={(e) => props.setStudentIdentifier(e.target.value)} />
          </Field>
        </>
      )}

      {role === "Merchant" && (
        <>
          <Field label="Business name">
            <input className="input" value={props.businessName} onChange={(e) => props.setBusinessName(e.target.value)} />
          </Field>
          <Field label="Category">
            <Dropdown<string>
              options={[
                { value: "1", label: "Retail", icon: <Store className="h-4.5 w-4.5 text-blue-500" /> },
                { value: "2", label: "Food / Canteen", icon: <Store className="h-4.5 w-4.5 text-emerald-500" /> },
                { value: "3", label: "Services", icon: <Store className="h-4.5 w-4.5 text-indigo-500" /> },
                { value: "4", label: "Other", icon: <Store className="h-4.5 w-4.5 text-zinc-500" /> },
              ]}
              value={props.merchantCategory}
              onChange={props.setMerchantCategory}
            />
          </Field>
          <Field label="Business description">
            <textarea className="input" value={props.businessDescription} onChange={(e) => props.setBusinessDescription(e.target.value)} />
          </Field>
        </>
      )}

      {role === "EventOrganizer" && (
        <>
          <Field label="Club / organization name">
            <input className="input" value={props.organizationName} onChange={(e) => props.setOrganizationName(e.target.value)} />
          </Field>
          <Field label="Organization description">
            <textarea className="input" value={props.organizationDescription} onChange={(e) => props.setOrganizationDescription(e.target.value)} />
          </Field>
        </>
      )}
    </>
  );
}
interface UniversityAdminFieldsProps { code: string; setCode: SetString; availability: { data?: UniversityRecord | null; isFetching: boolean }; name: string; setName: SetString; address: string; setAddress: SetString; title: string; setTitle: SetString; }
function UniversityAdminFields(props: UniversityAdminFieldsProps) { const availabilityText = props.code.length < 2 ? "Enter 2–32 uppercase characters." : props.availability.isFetching ? "Checking availability…" : props.availability.data ? "Already taken" : "Available"; return <><Field label="University code"><input className="input uppercase" value={props.code} onChange={(e) => props.setCode(e.target.value)} placeholder="" required /><p className={`text-xs ${props.availability.data ? "text-red-600" : "text-emerald-600"}`}>{availabilityText}</p></Field><Field label="University name"><input className="input" value={props.name} onChange={(e) => props.setName(e.target.value)} required /></Field><Field label="University address"><textarea className="input" value={props.address} onChange={(e) => props.setAddress(e.target.value)} required /></Field><Field label="Your title"><input className="input" value={props.title} onChange={(e) => props.setTitle(e.target.value)} placeholder="Registrar" required /></Field></>; }
function WalletPill({ address, copied, onCopy }: { address: string; copied: boolean; onCopy: () => void }) { return <div className="flex items-center justify-between rounded-full border bg-zinc-50 px-4 py-2 text-xs font-mono text-zinc-500"><span><Wallet className="mr-2 inline size-4" />{address.slice(0, 6)}…{address.slice(-6)}</span><button type="button" onClick={onCopy}>{copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}</button></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5 text-sm font-semibold">{label}{children}</label>; }
function Error({ message }: { message: string }) { return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 break-words whitespace-pre-wrap max-h-60 overflow-y-auto">{message}</p>; }
function Guard({ title, message }: { title: string; message: string }) { return <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] p-6"><div className="max-w-md rounded-xl border bg-white p-8 text-center"><AlertCircle className="mx-auto size-10 text-red-600" /><h1 className="mt-4 text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-zinc-500">{message}</p></div></main>; }
export function PendingState({ university = false }: { university?: boolean }) { return <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] p-6"><div className="max-w-md rounded-xl border bg-white p-8 text-center"><Clock3 className="mx-auto size-10 text-amber-600" /><h1 className="mt-4 text-2xl font-semibold">{university ? "Awaiting Platform Admin Approval" : "Verification Pending"}</h1><p className="mt-2 text-sm text-zinc-500">{university ? "Your university claim is recorded on-chain but remains unavailable until the Platform Admin approves it. Dashboard access is locked until then." : "Your profile was submitted on-chain. Your University Admin must verify it before campus actions and dashboard access are unlocked."}</p></div></main>; }
export default Login;
