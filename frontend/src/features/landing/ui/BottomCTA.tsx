export function BottomCTA({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="bg-background px-6 py-24 text-center transition-colors">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-foreground sm:text-4xl sm:leading-11">
          <span className="sm:hidden">Ready to evolve your campus economy?</span>
          <span className="hidden sm:inline">Ready to get started?</span>
        </h2>
        <div className="mt-8 flex flex-col items-center gap-6 sm:gap-8">
          <button
            onClick={onGetStarted}
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold tracking-[0.05em] text-background transition-opacity hover:opacity-90 cursor-pointer sm:px-12 sm:py-4"
          >
            Get Started<span className="sm:hidden"> Now</span>
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4 sm:py-1.5 sm:normal-case sm:tracking-normal">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />{" "}
            <span className="sm:hidden">Stellar Testnet Live</span>
            <span className="hidden sm:inline">Built on Stellar · Testnet</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BottomCTA;
