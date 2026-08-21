import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from "@/shared/theme";

function TestConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeProvider & useTheme", () => {
  let mediaQueryListeners: ((e: { matches: boolean }) => void)[] = [];
  let matchesDark = false;

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    mediaQueryListeners = [];
    matchesDark = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: matchesDark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_, listener) => {
          mediaQueryListeners.push(listener as (e: { matches: boolean }) => void);
        }),
        removeEventListener: vi.fn((_, listener) => {
          mediaQueryListeners = mediaQueryListeners.filter((l) => l !== listener);
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.className = "";
  });

  it("throws an error when useTheme is used outside ThemeProvider", () => {
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => render(<TestConsumer />)).toThrow(
      "useTheme must be used within a ThemeProvider"
    );

    console.error = originalError;
  });

  it("initializes with default system theme and sets appropriate class", () => {
    matchesDark = false;
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("resolves system dark theme correctly", () => {
    matchesDark = true;
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("allows switching theme to dark and persists to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByText("Set Dark"));

    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("allows switching theme to light and persists to localStorage", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("dark");

    await user.click(screen.getByText("Set Light"));

    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("reacts dynamically to system OS preference changes when in system mode", () => {
    matchesDark = false;
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("resolved").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Simulate OS switching to dark mode
    act(() => {
      mediaQueryListeners.forEach((listener) => listener({ matches: true }));
    });

    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
