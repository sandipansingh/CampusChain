import { WalletAccess } from "@/features/wallet/ui/WalletAccess";
import { WalletDashboard } from "@/features/wallet/ui/WalletDashboard";

export default function DashboardPage() {
  return (
    <WalletAccess allowedRoles={[1, 2, 3]}>
      <WalletDashboard />
    </WalletAccess>
  );
}
