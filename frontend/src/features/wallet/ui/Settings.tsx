"use client";

import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { useWallet } from "@/shared/stellar/useWallet";

const roles: Record<number, string> = {
  1: "Student",
  2: "Merchant",
  3: "Event Organizer",
  4: "University Admin",
  5: "Platform Admin",
};

const verification: Record<number, string> = {
  1: "Pending",
  2: "Verified",
  3: "Rejected",
};

const merchantCategories: Record<number, string> = {
  0: "Bookstore",
  1: "Cafeteria",
  2: "Food Canteen",
  3: "Services",
  4: "Other",
};

export function Settings() {
  const { address } = useWallet();
  const { data: profile } = useCampusProfile(address);

  if (!profile) return null;

  // Retrieve raw Student ID from local storage for the connected wallet
  const localStudentId = address ? localStorage.getItem(`campus_student_id_${address}`) : null;
  const studentIdDisplay = localStudentId || (profile.details?.studentIdentifierHash
    ? `Hashed: ${String(profile.details.studentIdentifierHash).slice(0, 10)}...`
    : "N/A");

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-bold">Identity profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        University code and role are immutable after registration.
      </p>

      <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2 border-b border-border/60 pb-5">
        <Info label="Name" value={profile.fullName} />
        <Info label="Role" value={roles[profile.role] ?? "Unknown"} />
        <Info label="University" value={profile.universityCode ?? "Platform-wide"} />
        <Info label="Verification Status" value={verification[profile.verificationStatus] ?? "Unknown"} />
      </dl>

      {/* Role-Specific details */}
      {profile.role === 1 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Student Details</h3>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <Info label="Department" value={String(profile.details?.department || "N/A")} />
            <Info label="Program" value={String(profile.details?.program || "N/A")} />
            <Info label="Graduation Year" value={String(profile.details?.graduationYear || "N/A")} />
            <Info label="Student ID" value={studentIdDisplay} />
          </dl>
        </div>
      )}

      {profile.role === 2 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Merchant Details</h3>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <Info label="Business Name" value={String(profile.details?.businessName || "N/A")} />
            <Info label="Category" value={merchantCategories[Number(profile.details?.category)] ?? "Other"} />
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Description</dt>
              <dd className="mt-1 font-medium text-foreground/90 whitespace-pre-wrap">{String(profile.details?.businessDescription || "N/A")}</dd>
            </div>
          </dl>
        </div>
      )}

      {profile.role === 3 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Organizer Details</h3>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <Info label="Organization Name" value={String(profile.details?.organizationName || "N/A")} />
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization Description</dt>
              <dd className="mt-1 font-medium text-foreground/90 whitespace-pre-wrap">{String(profile.details?.organizationDescription || "N/A")}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground/90">{value}</dd>
    </div>
  );
}

export default Settings;
