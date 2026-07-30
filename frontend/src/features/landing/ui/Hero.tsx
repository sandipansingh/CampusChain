export function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="bg-[radial-gradient(circle_at_50%_50%,#f7f7f5_0%,#ffffff_68%)] pb-16 pt-28 sm:pb-20 sm:pt-40">
      <div className="mx-auto max-w-7xl px-6 text-left sm:text-center">
        <h1 className="mx-auto mb-4 max-w-4xl text-4xl font-bold leading-[1.12] tracking-[-0.03em] text-zinc-950 sm:mb-6 sm:text-5xl sm:font-extrabold">
          One wallet for your entire campus economy
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg font-medium leading-7 text-zinc-500 sm:mb-10 sm:text-xl sm:leading-[30px]">
          <span className="sm:hidden">Modernizing university payments with a unified, secure, and instant blockchain ecosystem.</span>
          <span className="hidden sm:inline">A seamless, XLM-powered payment infrastructure designed specifically for students, faculty, and university administrators.</span>
        </p>
        <div className="mb-12 flex flex-col gap-3 sm:mb-20 sm:flex-row sm:justify-center sm:gap-4">
          <button
            onClick={onGetStarted}
            className="rounded-lg bg-zinc-950 px-8 py-4 text-center text-sm font-semibold tracking-[0.05em] text-white transition-opacity hover:opacity-90 cursor-pointer"
          >
            Get Started
          </button>
          <a href="#features" className="rounded-lg border border-zinc-200 px-8 py-4 text-center text-sm font-semibold tracking-[0.05em] text-zinc-950 transition-colors hover:bg-[#f7f7f5]">Learn More</a>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-12 sm:border-t sm:border-zinc-200 sm:pt-16">
          <Stat desktopValue="XLM-powered" mobileValue="0.0s" desktopLabel="Built on Stellar" mobileLabel="Settlement" />
          <Stat desktopValue="Instant Settlement" mobileValue="12+" desktopLabel="Global Speed" mobileLabel="Partners" />
          <Stat desktopValue="Zero Card Fees" mobileValue="0%" desktopLabel="Non-Custodial Flow" mobileLabel="Card Fees" />
          <Stat mobileValue="24/7" mobileLabel="Uptime" />
        </div>
      </div>
    </section>
  );
}

function Stat({ desktopValue, mobileValue, desktopLabel, mobileLabel }: { desktopValue?: string; mobileValue?: string; desktopLabel?: string; mobileLabel?: string }) {
  return (
    <div className={desktopValue ? "rounded-xl border border-zinc-200 bg-[#f7f7f5] p-6 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0" : "rounded-xl border border-zinc-200 bg-[#f7f7f5] p-6 sm:hidden"}>
      <div className="text-2xl font-bold tracking-[-0.02em] text-zinc-950 sm:text-4xl">{desktopValue && <span className="hidden sm:inline">{desktopValue}</span>}<span className="sm:hidden">{mobileValue}</span></div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:mt-1 sm:text-sm sm:tracking-[0.12em]">{desktopLabel && <span className="hidden sm:inline">{desktopLabel}</span>}<span className="sm:hidden">{mobileLabel}</span></div>
    </div>
  );
}
