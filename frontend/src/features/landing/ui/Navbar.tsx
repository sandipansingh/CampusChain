"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#universities", label: "For Universities" },
];

export function Navbar({ onGetStarted }: { onGetStarted: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-[-0.06em] text-zinc-950">CampusChain</Link>
          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-semibold tracking-[0.05em] text-zinc-500 transition-colors hover:text-zinc-950">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onGetStarted}
            className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold tracking-[0.05em] text-white transition-opacity hover:opacity-90 sm:px-6 sm:py-2.5 cursor-pointer"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="landing-mobile-menu"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="rounded-lg p-2 text-zinc-950 transition-colors hover:bg-zinc-100 md:hidden"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div id="landing-mobile-menu" className="border-t border-zinc-200 bg-white px-6 py-4 shadow-sm md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="py-3 text-base font-semibold text-zinc-700">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
