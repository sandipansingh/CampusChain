import { WalletAccess } from "@/features/wallet/ui/WalletAccess";
import { UniversityDashboard } from "@/features/wallet/ui/UniversityDashboard";

export default function UniversityPage() {
  return (
    <WalletAccess allowedRoles={[4]}>
      <UniversityDashboard />
    </WalletAccess>
  );
}
