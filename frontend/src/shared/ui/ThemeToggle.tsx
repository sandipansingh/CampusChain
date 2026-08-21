"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type Theme } from "@/shared/theme";

export interface ThemeToggleProps {
  variant?: "compact" | "segmented" | "dropdown";
  className?: string;
  align?: "left" | "right";
}

const themeOptions: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({
  variant = "compact",
  className = "",
  align = "right",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (variant === "segmented") {
    return (
      <div
        role="radiogroup"
        aria-label="Select color theme"
        className={`inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border ${className}`}
      >
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-card text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact dropdown variant (default for headers & navbars)
  const CurrentIcon =
    theme === "system"
      ? Monitor
      : resolvedTheme === "dark"
      ? Moon
      : Sun;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Toggle theme (Current: ${theme})`}
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all hover:bg-muted/80 hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none cursor-pointer"
      >
        <CurrentIcon className="h-4 w-4 transition-transform duration-200" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Theme options"
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-36 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100`}
        >
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-foreground" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
