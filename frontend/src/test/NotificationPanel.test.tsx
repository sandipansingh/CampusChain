/**
 * NotificationPanel.test.tsx
 *
 * Component tests for NotificationPanel covering all three visual states:
 *   - Empty: no notifications → inbox empty message shown
 *   - Populated: items shown with title, message, tx hash link, and timestamp
 *   - Close behaviour: Escape key and X button trigger onClose
 *
 * The NotificationStore is reset before each test for isolation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationPanel } from "@/shared/ui/NotificationPanel";
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";
import type { DecodedEvent } from "@/shared/stellar/eventDecoder";

// Helpers
function makeEvent(overrides: Partial<DecodedEvent> = {}): DecodedEvent {
  return {
    id: "evt-001",
    eventName: "transfer",
    type: "transfer",
    title: "Token Transfer",
    message: "GABC1234...XXXXXXXX → GXYZ5678...YYYYYYYY",
    details: "250.00 CAMP",
    txHash: "abc12345...def67890",
    fullTxHash: "abc12345def67890abc12345def67890abc12345def67890abc12345def67890",
    timestamp: "just now",
    ledger: 5_000_100,
    color: "blue",
    icon: "transfer",
    ledgerClosedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Test Suite
describe("NotificationPanel", () => {
  beforeEach(() => {
    // Reset Zustand store to clean state for every test
    useNotificationStore.setState({ items: [], unreadCount: 0 });
  });

  it("renders empty state with inbox message when no items exist", () => {
    render(<NotificationPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    expect(screen.getByText(/Updates about profile approvals/)).toBeInTheDocument();
  });

  it("renders notification items with title, message, and details", () => {
    useNotificationStore.getState().addItems([makeEvent()]);
    render(<NotificationPanel isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Token Transfer")).toBeInTheDocument();
    expect(screen.getByText("GABC1234...XXXXXXXX → GXYZ5678...YYYYYYYY")).toBeInTheDocument();
    expect(screen.getByText("250.00 CAMP")).toBeInTheDocument();
  });

  it("renders a Stellar Expert link for each notification item", () => {
    useNotificationStore.getState().addItems([makeEvent()]);
    render(<NotificationPanel isOpen={true} onClose={vi.fn()} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("stellar.expert/explorer/testnet/tx/")
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders multiple notification items in order (newest first)", () => {
    useNotificationStore.getState().addItems([makeEvent({ id: "evt-001", title: "First Transfer" })]);
    useNotificationStore.getState().addItems([makeEvent({ id: "evt-002", title: "Second Transfer" })]);

    render(<NotificationPanel isOpen={true} onClose={vi.fn()} />);

    // The two rendered headings — Second Transfer was added later so it sits first
    const headings = screen.getAllByRole("paragraph").filter(
      (el) => el.textContent?.includes("Transfer")
    );
    expect(headings[0].textContent).toContain("Second Transfer");
    expect(headings[1].textContent).toContain("First Transfer");
  });

  it("calls onClose when the X button is clicked", async () => {
    const onClose = vi.fn();
    render(<NotificationPanel isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /Close notifications panel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    render(<NotificationPanel isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not render content when isOpen is false (panel is translated off-screen)", () => {
    render(<NotificationPanel isOpen={false} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("translate-x-full");
  });

  it("'Clear all' button removes all notifications", async () => {
    useNotificationStore.getState().addItems([makeEvent()]);
    render(<NotificationPanel isOpen={true} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(useNotificationStore.getState().items).toHaveLength(0);
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });
});
