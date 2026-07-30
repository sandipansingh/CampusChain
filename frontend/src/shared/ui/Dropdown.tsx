import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface DropdownOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
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
      {label && <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer transition-all duration-200"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {currentOption?.icon && <span className="flex-shrink-0 flex items-center justify-center">{currentOption.icon}</span>}
          <span className="truncate font-medium">{currentOption?.label || "Select..."}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground/80 transition-transform duration-200 shrink-0 ml-2", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute right-0 z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-border bg-card p-1.5 text-sm shadow-xl focus:outline-none animate-in fade-in slide-in-from-top-1 duration-200"
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
                "flex items-center gap-2.5 cursor-pointer select-none rounded-xl px-3 py-2.5 text-foreground hover:bg-accent hover:text-accent-foreground outline-none transition-all duration-150 my-0.5",
                opt.value === value && "bg-accent/70 text-accent-foreground font-semibold"
              )}
            >
              {opt.icon && <span className="flex-shrink-0 flex items-center justify-center">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
