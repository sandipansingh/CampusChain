export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 py-8 sm:py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-2xl font-bold tracking-[-0.06em] text-zinc-950">CampusChain</p>
          <p className="mt-2 text-xs font-medium text-zinc-500">
            <span className="sm:hidden">Next-generation university financial infrastructure.</span>
            <span className="hidden sm:inline">© 2024 CampusChain. All rights reserved.</span>
          </p>
        </div>
        <div className="hidden gap-8 md:flex">
          <a
            href="https://github.com/sandipansingh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold tracking-[0.05em] text-zinc-500 hover:text-zinc-950"
          >
            GitHub
          </a>
        </div>
        <p className="text-center text-xs font-medium text-zinc-400 sm:hidden">
          © 2024 CampusChain. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
