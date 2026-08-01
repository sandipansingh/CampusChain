export function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="bg-[radial-gradient(circle_at_50%_50%,#fbfbfa_0%,#ffffff_100%)] pb-16 pt-28 sm:pb-24 sm:pt-40">
      <div className="mx-auto max-w-7xl px-6 text-left sm:text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-zinc-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-zinc-600 sm:mb-6">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          Stellar Testnet Live & Active
        </div>
        <h1 className="mx-auto mb-4 max-w-4xl text-4xl font-bold leading-[1.12] tracking-[-0.03em] text-zinc-950 sm:mb-6 sm:text-6xl sm:font-extrabold">
          The ultimate decentralized campus economy
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg font-medium leading-7 text-zinc-500 sm:mb-10 sm:text-xl sm:leading-[30px]">
          <span className="sm:hidden">Decentralized payments, canteen food ordering, P2P escrow, scholarships, and ticketing powered by Stellar.</span>
          <span className="hidden sm:inline">A unified, secure payment infrastructure designed specifically for student marketplaces, real-time canteen ordering, on-chain scholarships, and events.</span>
        </p>
        <div className="mb-12 flex flex-col gap-3 sm:mb-20 sm:flex-row sm:justify-center sm:gap-4">
          <button
            onClick={onGetStarted}
            className="rounded-lg bg-zinc-950 px-6 py-3 text-center text-sm font-semibold tracking-[0.05em] text-white transition-all hover:bg-zinc-800 shadow-md cursor-pointer sm:px-8 sm:py-4"
          >
            Get Started
          </button>
          <a href="#features" className="rounded-lg border border-zinc-200 px-6 py-3 text-center text-sm font-semibold tracking-[0.05em] text-zinc-950 transition-colors hover:bg-zinc-50 sm:px-8 sm:py-4">Learn More</a>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8 sm:border-t sm:border-zinc-200/80 sm:pt-16">
          <Stat desktopValue="XLM Powered" mobileValue="XLM Powered" desktopLabel="1:100 CAMP Conversion Rate" mobileLabel="Built on Stellar" />
          <Stat desktopValue="Canteen Ordering" mobileValue="Canteen Orders" desktopLabel="Flat 1 CAMP fee · Live Tracking" mobileLabel="Canteen Storefronts" />
          <Stat desktopValue="100% On-Chain" mobileValue="On-Chain Escrow" desktopLabel="Secure Escrows & Scholarships" mobileLabel="Zero Fees" />
        </div>
      </div>
    </section>
  );
}

function Stat({ desktopValue, mobileValue, desktopLabel, mobileLabel }: { desktopValue: string; mobileValue: string; desktopLabel: string; mobileLabel: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-6 transition-all hover:bg-zinc-50 sm:border-0 sm:bg-transparent sm:p-0">
      <div className="text-xl font-bold tracking-[-0.02em] text-zinc-950 sm:text-3xl">
        <span className="hidden sm:inline">{desktopValue}</span>
        <span className="sm:hidden">{mobileValue}</span>
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:mt-2 sm:text-sm sm:tracking-[0.12em]">
        <span className="hidden sm:inline">{desktopLabel}</span>
        <span className="sm:hidden">{mobileLabel}</span>
      </div>
    </div>
  );
}
