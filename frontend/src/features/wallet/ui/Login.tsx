"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Lock, Wallet, Copy, Check } from "lucide-react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS } from "@/shared/stellar/client";
import {
  fetchUniversities,
  fetchUniversity,
  type OnboardingRole,
  type UniversityRecord,
  UniversityApprovalStatus,
} from "@/features/wallet/service/campusIdentity";

interface LoginProps { showOnboarding?: boolean; }

const roleLabels: Record<OnboardingRole, string> = {
  Student: "Student", Merchant: "Merchant", EventOrganizer: "Event Organizer", UniversityAdmin: "University Admin",
};

export function Login({ showOnboarding = false }: LoginProps) {
  const { connect, isConnecting, address } = useWallet();
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

  const pending = isConnecting;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
  }

  return <div className="min-h-screen w-full bg-[#F7F7F5] text-zinc-950 flex items-center justify-center p-6"><main className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
    {!showOnboarding ? <div className="space-y-6 text-center"><h1 className="text-4xl font-bold">CampusChain</h1><p className="text-sm text-zinc-500">Your campus wallet for payments, marketplace, events and rewards.</p><button onClick={() => void connect()} disabled={pending} className="w-full rounded-lg bg-zinc-950 px-6 py-4 font-semibold text-white disabled:opacity-50">Connect Stellar Wallet <ArrowRight className="ml-2 inline size-4" /></button></div> : <div className="space-y-5"><header className="text-center"><h1 className="text-2xl font-semibold">Complete your profile</h1></header><form onSubmit={submit} className="space-y-4"><Field label="Role"><select value={role} onChange={(e) => { setRole(e.target.value as OnboardingRole); setUniversityCode(""); }} className="input">{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Jane Doe" required /></Field>{role === "UniversityAdmin" ? <UniversityAdminFields code={universityCode} setCode={(value) => setUniversityCode(value.toUpperCase())} availability={availability} name={universityName} setName={setUniversityName} address={universityAddress} setAddress={setUniversityAddress} title={adminTitle} setTitle={setAdminTitle} /> : <ScopedFields role={role} universityCode={universityCode} setUniversityCode={setUniversityCode} approvedUniversities={approvedUniversities} loadingUniversities={universities.isLoading} department={department} setDepartment={setDepartment} program={program} setProgram={setProgram} graduationYear={graduationYear} setGraduationYear={setGraduationYear} studentIdentifier={studentIdentifier} setStudentIdentifier={setStudentIdentifier} businessName={businessName} setBusinessName={setBusinessName} merchantCategory={merchantCategory} setMerchantCategory={setMerchantCategory} businessDescription={businessDescription} setBusinessDescription={setBusinessDescription} organizationName={organizationName} setOrganizationName={setOrganizationName} organizationDescription={organizationDescription} setOrganizationDescription={setOrganizationDescription} />}</form></div>}</main></div>;
}

type SetString = (value: string) => void;
interface ScopedFieldsProps { role: Exclude<OnboardingRole, "UniversityAdmin">; universityCode: string; setUniversityCode: SetString; approvedUniversities: UniversityRecord[]; loadingUniversities: boolean; department: string; setDepartment: SetString; program: string; setProgram: SetString; graduationYear: string; setGraduationYear: SetString; studentIdentifier: string; setStudentIdentifier: SetString; businessName: string; setBusinessName: SetString; merchantCategory: string; setMerchantCategory: SetString; businessDescription: string; setBusinessDescription: SetString; organizationName: string; setOrganizationName: SetString; organizationDescription: string; setOrganizationDescription: SetString; }
function ScopedFields(props: ScopedFieldsProps) { return null; }
interface UniversityAdminFieldsProps { code: string; setCode: SetString; availability: { data?: UniversityRecord | null; isFetching: boolean }; name: string; setName: SetString; address: string; setAddress: SetString; title: string; setTitle: SetString; }
function UniversityAdminFields(props: UniversityAdminFieldsProps) { return null; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5 text-sm font-semibold">{label}{children}</label>; }
export default Login;
