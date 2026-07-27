import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface DropdownOption<T> {
  value: T;
  label: string;
}

interface DropdownProps<T> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function Dropdown<T>({ options, value, onChange, label, className }: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
    if (e.key === "ArrowDown" && !isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full text-left", className)} onKeyDown={handleKeyDown}>
      {label && <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
      >
        <span>{currentOption?.label || "Select..."}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card p-1 text-sm shadow-md focus:outline-none"
        >
          {options.map((opt) => (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "relative cursor-pointer select-none rounded-md px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground outline-none",
                opt.value === value && "bg-accent text-accent-foreground font-semibold"
              )}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
