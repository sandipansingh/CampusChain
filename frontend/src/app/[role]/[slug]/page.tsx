import { WalletAccess } from "@/features/wallet/ui/WalletAccess";
import { WalletDashboard } from "@/features/wallet/ui/WalletDashboard";
import { UniversityDashboard } from "@/features/wallet/ui/UniversityDashboard";
import { PlatformDashboard } from "@/features/wallet/ui/PlatformDashboard";
import { notFound } from "next/navigation";

export default function RoleSlugPage({ params }: { params: { role: string; slug: string } }) {
  const role = params.role;

  if (role === "student" || role === "merchant" || role === "organizer") {
    const allowed = role === "student" ? [1] : role === "merchant" ? [2] : [3];
    return (
      <WalletAccess allowedRoles={allowed}>
        <WalletDashboard />
      </WalletAccess>
    );
  }

  if (role === "university") {
    return (
      <WalletAccess allowedRoles={[4]}>
        <UniversityDashboard />
      </WalletAccess>
    );
  }

  if (role === "platform") {
    return (
      <WalletAccess allowedRoles={[5]}>
        <PlatformDashboard />
      </WalletAccess>
    );
  }

  notFound();
}
