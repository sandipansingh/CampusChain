import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login, PendingState } from "@/features/wallet/ui/Login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { testUserAddr, adminAddr, mockConnect, mockDisconnect } = vi.hoisted(() => ({
  testUserAddr: "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44",
  adminAddr: "GDU2FX42Y3RHKVFF7R2O72Y6N3Y44GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V",
  mockConnect: vi.fn(),
  mockDisconnect: vi.fn(),
}));

// Mock useWallet
vi.mock("@/shared/stellar/useWallet", () => ({
  useWallet: () => ({
    address: testUserAddr,
    isConnected: true,
    isConnecting: false,
    error: null,
    wrongNetwork: false,
    connect: mockConnect,
    disconnect: mockDisconnect,
  }),
}));

vi.mock("@/features/wallet/hooks/useWallet", () => ({
  useRegisterProfileMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useRegisterUniversityMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock("@/features/wallet/service/campusIdentity", () => ({
  fetchUniversities: vi.fn().mockResolvedValue([
    {
      code: "HARVARD",
      name: "Harvard University",
      approvalStatus: 2, // Approved
      admin: adminAddr,
    },
  ]),
  fetchUniversity: vi.fn().mockResolvedValue(null),
  fetchUniversityStudentIds: vi.fn().mockResolvedValue([]),
  bufToHex: (buf: Uint8Array) => Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join(""),
  UniversityApprovalStatus: { Approved: 2, Pending: 1, Rejected: 3 },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe("Onboarding & Login UX Experience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders multi-step role selection cards in onboarding mode", () => {
    renderWithProviders(<Login showOnboarding={true} />);

    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 3 • Choose your role/)).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Campus Merchant")).toBeInTheDocument();
    expect(screen.getByText("Event Organizer")).toBeInTheDocument();
    expect(screen.getByText("University Admin")).toBeInTheDocument();
  });

  it("navigates between onboarding steps with validation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login showOnboarding={true} />);

    // Click Continue to step 2
    const continueBtn = screen.getByRole("button", { name: /Continue with Student/i });
    await user.click(continueBtn);

    // Verify on step 2
    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 3 • Campus & identity details/)).toBeInTheDocument();

    // Try reviewing without full name -> should show validation error
    const reviewBtn = screen.getByRole("button", { name: /Review Profile/i });
    await user.click(reviewBtn);
    expect(screen.getByText("Please enter your full name.")).toBeInTheDocument();
  });

  it("renders PendingState with 3-stage progress tracker and manual refresh", () => {
    renderWithProviders(
      <PendingState
        address={testUserAddr}
        universityCode="HARVARD"
        role="Student"
        onChangeWallet={mockConnect}
        onDisconnect={mockDisconnect}
      />
    );

    expect(screen.getByText("Verification Pending")).toBeInTheDocument();
    expect(screen.getByText("Stellar Wallet Connected")).toBeInTheDocument();
    expect(screen.getByText("On-Chain Identity Recorded")).toBeInTheDocument();
    expect(screen.getByText("University Admin Review")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Check Status Now/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change Wallet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Disconnect/i })).toBeInTheDocument();
  });
});
