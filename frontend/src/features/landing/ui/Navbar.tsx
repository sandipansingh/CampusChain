"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#universities", label: "For Universities" },
];

export function Navbar({ onGetStarted }: { onGetStarted: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-2xl font-bold tracking-[-0.06em] text-foreground">
            <Image
              src="/icon.png"
              alt="CampusChain Logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
              priority
            />
            <span>CampusChain</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-semibold tracking-[0.05em] text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle variant="compact" />
          <button
            onClick={onGetStarted}
            className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold tracking-[0.05em] text-background transition-opacity hover:opacity-90 sm:px-6 sm:py-2.5 sm:text-sm cursor-pointer"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="landing-mobile-menu"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted md:hidden"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div id="landing-mobile-menu" className="border-t border-border bg-background px-6 py-4 shadow-sm md:hidden animate-in fade-in slide-in-from-top duration-150">
          <div className="mx-auto flex max-w-7xl flex-col">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="py-3 text-base font-semibold text-foreground/90 hover:text-foreground">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
