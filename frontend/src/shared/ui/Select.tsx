import { useState, useRef, useEffect, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  className,
  error,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const selectId = useId();
  const labelId = useId();

  const currentOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update highlighted index when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      const activeIdx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(activeIdx >= 0 ? activeIdx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, options, value]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex, isOpen]);

  const selectOption = (opt: SelectOption) => {
    if (disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          selectOption(options[highlightedIndex]);
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev + 1) % options.length);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;

      case "Tab":
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full flex flex-col gap-1.5", className)}
    >
      {label && (
        <label
          id={labelId}
          htmlFor={selectId}
          className="text-sm font-semibold text-primary select-none"
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        <button
          id={selectId}
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? labelId : undefined}
          onKeyDown={handleKeyDown}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
            error && "border-destructive focus:ring-destructive focus:border-destructive"
          )}
        >
          <span className={cn(!currentOption && "text-outline")}>
            {currentOption ? currentOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-secondary transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <ul
            role="listbox"
            tabIndex={-1}
            aria-labelledby={label ? labelId : undefined}
            className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border border-outline-variant bg-surface-container-lowest p-1 shadow-lg focus:outline-none"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <li key={opt.value} role="none">
                  <button
                    ref={(el) => {
                      optionsRef.current[idx] = el;
                    }}
                    role="option"
                    type="button"
                    aria-selected={isSelected}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full cursor-pointer select-none rounded-md px-3 py-2 text-left text-body-md text-primary outline-none transition-colors",
                      isHighlighted && "bg-surface-container-low font-semibold",
                      isSelected && "bg-primary text-on-primary font-bold hover:bg-primary/90"
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && <span className="text-xs font-medium text-destructive">{error}</span>}
    </div>
  );
}
