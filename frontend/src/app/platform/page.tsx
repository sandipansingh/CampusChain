import { WalletAccess } from "@/features/wallet/ui/WalletAccess";
import { PlatformDashboard } from "@/features/wallet/ui/PlatformDashboard";

export default function PlatformPage() {
  return (
    <WalletAccess allowedRoles={[5]}>
      <PlatformDashboard />
    </WalletAccess>
  );
}
