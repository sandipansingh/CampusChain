import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Login, PendingState } from "../features/wallet/ui/Login";
import { useWalletStore } from "../features/wallet/state/useWalletStore";

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("@/shared/stellar/useWallet", () => ({
  useWallet: () => ({
    address: useWalletStore((s) => s.address),
    isConnected: useWalletStore((s) => s.isConnected),
    isConnecting: useWalletStore((s) => s.isConnecting),
    wrongNetwork: useWalletStore((s) => s.wrongNetwork),
    error: useWalletStore((s) => s.error),
    connect: mockConnect,
    disconnect: mockDisconnect,
    initialize: vi.fn(),
  }),
}));

vi.mock("@/features/wallet/service/campusIdentity", () => ({
  fetchUniversities: vi.fn().mockResolvedValue([]),
  fetchUniversity: vi.fn().mockResolvedValue(null),
  UniversityApprovalStatus: { Approved: 2, Pending: 1, Rejected: 3 },
  fetchUniversityStudentIds: vi.fn().mockResolvedValue([]),
  bufToHex: vi.fn(() => "hex"),
}));

vi.mock("@/features/wallet/hooks/useWallet", () => ({
  useRegisterProfileMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRegisterUniversityMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCampusProfile: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useCampusUniversity: vi.fn().mockReturnValue({ data: null, isLoading: false }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("Login & Onboarding Wallet Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useWalletStore.setState({
      address: "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44",
      isConnected: true,
      isConnecting: false,
      wrongNetwork: false,
      error: null,
    });
  });

  it("renders WalletPill with Change and Disconnect buttons during onboarding", () => {
    renderWithClient(<Login showOnboarding={true} />);

    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
    expect(screen.getByText(/GBB2GD.*N3Y44/)).toBeInTheDocument();

    const changeBtn = screen.getByRole("button", { name: /change/i });
    const disconnectBtn = screen.getByRole("button", { name: /disconnect/i });

    expect(changeBtn).toBeInTheDocument();
    expect(disconnectBtn).toBeInTheDocument();
  });

  it("calls connect when Change button is clicked on onboarding screen", async () => {
    renderWithClient(<Login showOnboarding={true} />);

    const changeBtn = screen.getByRole("button", { name: /change/i });
    await userEvent.click(changeBtn);

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("calls disconnect when Disconnect button is clicked on onboarding screen", async () => {
    renderWithClient(<Login showOnboarding={true} />);

    const disconnectBtn = screen.getByRole("button", { name: /disconnect/i });
    await userEvent.click(disconnectBtn);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("renders PendingState with Change Wallet and Disconnect buttons when props are passed", async () => {
    const onChangeWallet = vi.fn();
    const onDisconnect = vi.fn();

    render(
      <PendingState
        university={false}
        onChangeWallet={onChangeWallet}
        onDisconnect={onDisconnect}
      />
    );

    expect(screen.getByText("Verification Pending")).toBeInTheDocument();
    
    const changeBtn = screen.getByRole("button", { name: /change wallet/i });
    const disconnectBtn = screen.getByRole("button", { name: /disconnect/i });

    expect(changeBtn).toBeInTheDocument();
    expect(disconnectBtn).toBeInTheDocument();

    await userEvent.click(changeBtn);
    expect(onChangeWallet).toHaveBeenCalledTimes(1);

    await userEvent.click(disconnectBtn);
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("renders Guard with Switch Wallet and Disconnect Wallet buttons on wrong network", async () => {
    useWalletStore.setState({
      address: "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44",
      isConnected: true,
      wrongNetwork: true,
    });

    renderWithClient(<Login showOnboarding={true} />);

    expect(screen.getByText("Wrong Network Detected")).toBeInTheDocument();

    const switchBtn = screen.getByRole("button", { name: /switch wallet/i });
    const disconnectBtn = screen.getByRole("button", { name: /disconnect wallet/i });

    expect(switchBtn).toBeInTheDocument();
    expect(disconnectBtn).toBeInTheDocument();

    await userEvent.click(switchBtn);
    expect(mockConnect).toHaveBeenCalledTimes(1);

    await userEvent.click(disconnectBtn);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
