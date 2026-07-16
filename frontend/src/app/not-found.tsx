"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-[24px] p-8 max-w-md w-full text-center flex flex-col items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-700">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Page Not Found
          </h2>
          <p className="text-slate-800 text-xs font-semibold leading-relaxed">
            The ledger address or resource path you are looking for does not exist or has been relocated in the latest block sequence.
          </p>
        </div>
        <Link href="/dashboard" className="w-full">
          <button className="w-full h-11 bg-accent text-white font-semibold text-xs rounded-xl flex items-center justify-center hover:opacity-95 active:scale-95 transition-all duration-200">
            Return to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
