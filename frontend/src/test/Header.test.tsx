import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Header from "../components/Header";
import { useWalletStore } from "../state/useWalletStore";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/hooks/useCampusToken", () => ({
  useCampusUserRole: () => ({ data: 1 }),
}));

describe("Header Component", () => {
  beforeEach(() => {
    useWalletStore.setState({
      address: null,
      isConnecting: false,
      error: null,
    });
  });

  it("should render logo and main navigation links", () => {
    render(<Header />);
    expect(screen.getByText("CAMPUSCHAIN//")).toBeInTheDocument();
    expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
    expect(screen.getByText("ACTIVITY")).toBeInTheDocument();
    expect(screen.getByText("TRANSACTIONS")).toBeInTheDocument();
  });

  it("should show Connect Wallet button when disconnected", () => {
    render(<Header />);
    const connectBtn = screen.getByText("CONNECT WALLET");
    expect(connectBtn).toBeInTheDocument();
  });

  it("should show Disconnect button and slice address when connected", () => {
    useWalletStore.setState({
      address: "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6NXYZ123",
    });

    render(<Header />);
    expect(screen.getByText("DISCONNECT")).toBeInTheDocument();
    expect(screen.getByText("GBB2GD...XYZ123")).toBeInTheDocument();
  });
});
