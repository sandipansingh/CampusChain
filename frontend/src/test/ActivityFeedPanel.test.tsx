/**
 * ActivityFeedPanel.test.tsx
 *
 * Component tests for ActivityFeedPanel covering all three visual states:
 *   - Empty: no feed items → inbox empty message shown
 *   - Populated: items shown with title, message, tx hash link, and timestamp
 *   - Close behaviour: Escape key and X button trigger onClose
 *
 * The ActivityFeedStore is reset before each test for isolation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityFeedPanel } from "@/shared/ui/ActivityFeedPanel";
import { useActivityFeedStore } from "@/shared/hooks/useActivityFeedStore";
import type { DecodedEvent } from "@/shared/stellar/eventDecoder";

// ── Helpers ──────────────────────────────────────────────────────────────
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

// ── Test Suite ───────────────────────────────────────────────────────────
describe("ActivityFeedPanel", () => {
  beforeEach(() => {
    // Reset Zustand feed store to clean state for every test
    useActivityFeedStore.setState({ items: [], unreadCount: 0 });
  });

  it("renders empty state with inbox message when no items exist", () => {
    render(<ActivityFeedPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("No live activity yet")).toBeInTheDocument();
    expect(screen.getByText(/Contract events will appear here/)).toBeInTheDocument();
  });

  it("renders feed items with title, message, and details", () => {
    useActivityFeedStore.getState().addItems([makeEvent()]);
    render(<ActivityFeedPanel isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Token Transfer")).toBeInTheDocument();
    expect(screen.getByText("GABC1234...XXXXXXXX → GXYZ5678...YYYYYYYY")).toBeInTheDocument();
    expect(screen.getByText("250.00 CAMP")).toBeInTheDocument();
  });

  it("renders a Stellar Expert link for each feed item", () => {
    useActivityFeedStore.getState().addItems([makeEvent()]);
    render(<ActivityFeedPanel isOpen={true} onClose={vi.fn()} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("stellar.expert/explorer/testnet/tx/")
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders multiple feed items in order (newest first)", () => {
    // Add items in two separate calls (simulating sequential poll ticks)
    // Second call's items are prepended, so they appear first in the list.
    useActivityFeedStore.getState().addItems([makeEvent({ id: "evt-001", title: "First Transfer" })]);
    useActivityFeedStore.getState().addItems([makeEvent({ id: "evt-002", title: "Second Transfer" })]);

    render(<ActivityFeedPanel isOpen={true} onClose={vi.fn()} />);

    // The two rendered headings — Second Transfer was added later so it sits first
    const headings = screen.getAllByRole("paragraph").filter(
      (el) => el.textContent?.includes("Transfer")
    );
    expect(headings[0].textContent).toContain("Second Transfer");
    expect(headings[1].textContent).toContain("First Transfer");
  });

  it("calls onClose when the X button is clicked", async () => {
    const onClose = vi.fn();
    render(<ActivityFeedPanel isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /Close activity feed/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    render(<ActivityFeedPanel isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("marks all items as read when the panel opens", () => {
    // Add items manually with an unread count
    useActivityFeedStore.setState({ items: [makeEvent()], unreadCount: 3 });
    render(<ActivityFeedPanel isOpen={true} onClose={vi.fn()} />);

    // markAllRead is called in useEffect on mount when isOpen is true
    expect(useActivityFeedStore.getState().unreadCount).toBe(0);
  });

  it("does not render content when isOpen is false (panel is translated off-screen)", () => {
    render(<ActivityFeedPanel isOpen={false} onClose={vi.fn()} />);
    // Panel exists in DOM but is translated off-screen, not removed
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("translate-x-full");
  });

  it("'Clear all' button removes all items from the feed", async () => {
    useActivityFeedStore.getState().addItems([makeEvent()]);
    render(<ActivityFeedPanel isOpen={true} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(useActivityFeedStore.getState().items).toHaveLength(0);
    expect(screen.getByText("No live activity yet")).toBeInTheDocument();
  });
});
