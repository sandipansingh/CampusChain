"use client";

import React from "react";
import {
  HelpCircle,
  BookOpen,
  Wallet,
  ArrowRightLeft,
  Calendar,
  ShieldAlert
} from "lucide-react";

export default function HelpPage() {
  const faqList = [
    {
      title: "Getting Started & Wallet Setup",
      icon: Wallet,
      desc: "To interact with the CampusChain network, install the Freighter wallet browser extension. Select 'Testnet' in your wallet settings to connect to the Stellar sandbox.",
    },
    {
      title: "How to obtain Testnet Gas (XLM)",
      icon: HelpCircle,
      desc: "Stellar transactions require a small fraction of XLM to cover network fees. Navigate to the 'My Wallet' tab and click 'Request Testnet XLM' to automatically fund your public key from the Friendbot faucet.",
    },
    {
      title: "Understanding P2P Smart Escrow",
      icon: ArrowRightLeft,
      desc: "When purchasing items, create an escrow agreement. Your CAMP tokens are locked on-chain in the escrow smart contract. Once you receive the item, release the escrow to pay the seller. If there is an issue, request a refund.",
    },
    {
      title: "Digital Ticket Pass Validation",
      icon: Calendar,
      desc: "Club organizers can mint tickets for campus events. Students purchase tickets using CAMP tokens. The tickets are recorded directly on-chain and cryptographically validated by event hosts.",
    },
    {
      title: "Earning Campus Rewards",
      icon: BookOpen,
      desc: "Students can receive CAMP token distributions from university organizers as merit rewards for extracurricular work, club administration, or peer tutoring.",
    },
    {
      title: "Privacy & Security Policy",
      icon: ShieldAlert,
      desc: "CampusChain operates entirely on decentralized smart contracts. Your public key is public on the ledger, but no private identification data is stored on-chain.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 uppercase">
          Help & Support Center
        </h1>
        <p className="text-slate-700 text-xs font-semibold mt-1">
          Learn how to fund your wallet, validate event tickets, and lock secure escrow agreements.
        </p>
      </div>

      {/* Grid of help items - flat white borderless cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faqList.map((faq, index) => {
          const Icon = faq.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-[24px] flex flex-col gap-4"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {faq.title}
                </h3>
                <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                  {faq.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
