import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/shared/theme";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders compact toggle button and toggles dropdown menu", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle variant="compact" />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole("button", { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    // Open dropdown
    await user.click(toggleButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Check that all 3 options are rendered
    expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /system/i })).toBeInTheDocument();

    // Select Dark
    await user.click(screen.getByRole("menuitem", { name: /dark/i }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("closes compact dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle variant="compact" />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(toggleButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders segmented control with 3 radio options", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle variant="segmented" />
      </ThemeProvider>
    );

    const radioGroup = screen.getByRole("radiogroup", { name: /select color theme/i });
    expect(radioGroup).toBeInTheDocument();

    const lightRadio = screen.getByRole("radio", { name: /light/i });
    const darkRadio = screen.getByRole("radio", { name: /dark/i });
    const systemRadio = screen.getByRole("radio", { name: /system/i });

    expect(systemRadio).toHaveAttribute("aria-checked", "true");
    expect(darkRadio).toHaveAttribute("aria-checked", "false");

    await user.click(darkRadio);
    expect(darkRadio).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(lightRadio);
    expect(lightRadio).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
