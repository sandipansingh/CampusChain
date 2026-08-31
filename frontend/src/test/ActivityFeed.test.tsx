import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { decodeEvent } from "@/shared/stellar/eventDecoder";
import { eventBelongsToCampus, eventInvolvesAddress } from "@/features/transactions/service/events";
import { ActivityFeed } from "@/features/transactions/ui/ActivityFeed";
import * as useActivityFeedHook from "@/features/transactions/hooks/useActivityFeed";
import { nativeToScVal, StrKey } from "@stellar/stellar-sdk";

const ADDR_ADMIN = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const ADDR_STUDENT = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 2));
const ADDR_SELLER = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 3));

// Mock useWallet
vi.mock("@/shared/stellar/useWallet", () => ({
  useWallet: () => ({
    address: ADDR_ADMIN,
    disconnect: vi.fn(),
  }),
}));

describe("Activity Feed & Verification Request Event Handling", () => {
  describe("decodeEvent", () => {
    it("decodes ProfileSubmittedForVerification correctly", () => {
      const rawEvent = {
        id: "evt-01",
        ledger: 12345,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        topic: [
          nativeToScVal("ProfileSubmittedForVerification", { type: "symbol" }),
          nativeToScVal(ADDR_STUDENT, { type: "address" }),
        ],
        value: nativeToScVal("HARVARD", { type: "string" }),
      };

      const decoded = decodeEvent(rawEvent);
      expect(decoded.type).toBe("role");
      expect(decoded.title).toBe("Verification Request");
      expect(decoded.message).toContain(ADDR_STUDENT.slice(0, 8));
      expect(decoded.details).toBe("HARVARD");
      expect(decoded.universityCode).toBe("HARVARD");
      expect(decoded.status).toBe("pending");
      expect(decoded.icon).toBe("role");
      expect(decoded.color).toBe("purple");
    });

    it("decodes ProfileVerified correctly", () => {
      const rawEvent = {
        id: "evt-02",
        ledger: 12346,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        topic: [
          nativeToScVal("ProfileVerified", { type: "symbol" }),
          nativeToScVal(ADDR_ADMIN, { type: "address" }),
          nativeToScVal(ADDR_STUDENT, { type: "address" }),
        ],
        value: nativeToScVal("HARVARD", { type: "string" }),
      };

      const decoded = decodeEvent(rawEvent);
      expect(decoded.type).toBe("role");
      expect(decoded.title).toBe("Profile Verified");
      expect(decoded.message).toContain(ADDR_STUDENT.slice(0, 8));
      expect(decoded.details).toContain(ADDR_ADMIN.slice(0, 8));
      expect(decoded.universityCode).toBe("HARVARD");
      expect(decoded.status).toBe("verified");
      expect(decoded.color).toBe("emerald");
    });

    it("decodes ProfileRejected correctly", () => {
      const rawEvent = {
        id: "evt-03",
        ledger: 12347,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        topic: [
          nativeToScVal("ProfileRejected", { type: "symbol" }),
          nativeToScVal(ADDR_ADMIN, { type: "address" }),
          nativeToScVal(ADDR_STUDENT, { type: "address" }),
        ],
        value: nativeToScVal("HARVARD", { type: "string" }),
      };

      const decoded = decodeEvent(rawEvent);
      expect(decoded.type).toBe("role");
      expect(decoded.title).toBe("Profile Rejected");
      expect(decoded.color).toBe("orange");
    });

    it("decodes ScholarshipApplied correctly", () => {
      const rawEvent = {
        id: "evt-04",
        ledger: 12348,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        topic: [
          nativeToScVal("ScholarshipApplied", { type: "symbol" }),
          nativeToScVal(1, { type: "u64" }),
          nativeToScVal(ADDR_STUDENT, { type: "address" }),
          nativeToScVal("HARVARD", { type: "string" }),
        ],
        value: nativeToScVal([10, 500000000, "STEM Grant"], {
          type: ["u64", "i128", "string"],
        }),
      };

      const decoded = decodeEvent(rawEvent);
      expect(decoded.type).toBe("scholarship");
      expect(decoded.title).toBe("Scholarship Application Submitted");
      expect(decoded.icon).toBe("scholarship");
      expect(decoded.entityId).toBe(1);
      expect(decoded.amountCamp).toBe(50);
      expect(decoded.universityCode).toBe("HARVARD");
    });
  });

  describe("eventBelongsToCampus", () => {
    it("matches when university code is in event.value (e.g. ProfileSubmittedForVerification)", () => {
      const event = {
        topic: [
          nativeToScVal("ProfileSubmittedForVerification", { type: "symbol" }),
          nativeToScVal(ADDR_STUDENT, { type: "address" }),
        ],
        value: nativeToScVal("HARVARD", { type: "string" }),
      };

      expect(eventBelongsToCampus(event, "HARVARD")).toBe(true);
      expect(eventBelongsToCampus(event, "harvard")).toBe(true);
      expect(eventBelongsToCampus(event, "MIT")).toBe(false);
    });

    it("matches when university code is in event.topic", () => {
      const event = {
        topic: [
          nativeToScVal("item_listed", { type: "symbol" }),
          nativeToScVal(1, { type: "u64" }),
          nativeToScVal(ADDR_SELLER, { type: "address" }),
          nativeToScVal("HARVARD", { type: "string" }),
        ],
        value: nativeToScVal([10000000, "Book"], { type: ["i128", "string"] }),
      };

      expect(eventBelongsToCampus(event, "HARVARD")).toBe(true);
      expect(eventBelongsToCampus(event, "STANFORD")).toBe(false);
    });
  });

  describe("eventInvolvesAddress", () => {
    it("returns true when address is in topic", () => {
      const event = {
        topic: [
          nativeToScVal("transfer", { type: "symbol" }),
          nativeToScVal(ADDR_ADMIN, { type: "address" }),
          nativeToScVal(ADDR_STUDENT, { type: "address" }),
        ],
        value: nativeToScVal(100, { type: "i128" }),
      };

      expect(eventInvolvesAddress(event, ADDR_ADMIN)).toBe(true);
      expect(eventInvolvesAddress(event, ADDR_ADMIN.toLowerCase())).toBe(true);
      expect(eventInvolvesAddress(event, ADDR_SELLER)).toBe(false);
    });
  });

  describe("ActivityFeed component", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("renders activity feed with items and filter options", () => {
      const mockEvents = [
        {
          id: "1",
          eventName: "ProfileSubmittedForVerification",
          type: "role" as const,
          title: "Verification Request",
          message: "Applicant GDSTUDENT requested verification",
          details: "HARVARD",
          txHash: "tx123456",
          fullTxHash: "tx123456789abcdef",
          timestamp: "just now",
          ledger: 100,
          color: "purple" as const,
          icon: "role" as const,
          ledgerClosedAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(useActivityFeedHook, "useActivityFeed").mockReturnValue({
        events: mockEvents,
        filteredEvents: mockEvents,
        loading: false,
        loadingMore: false,
        hasMore: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
        typeFilter: "all",
        setTypeFilter: vi.fn(),
        sortBy: "newest",
        setSortBy: vi.fn(),
        refresh: vi.fn(),
        loadMore: vi.fn(),
      });

      render(<ActivityFeed universityCode="HARVARD" />);

      expect(screen.getByText("Activity Feed")).toBeInTheDocument();
      expect(screen.getByText("Verification Request")).toBeInTheDocument();
      expect(screen.getByText(/Applicant GDSTUDENT requested verification/)).toBeInTheDocument();
    });
  });
});
