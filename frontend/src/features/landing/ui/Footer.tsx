import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8 sm:py-16 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/icon.png"
              alt="CampusChain Logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg object-contain"
            />
            <p className="text-2xl font-bold tracking-[-0.06em] text-foreground">CampusChain</p>
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            <span className="sm:hidden">Next-generation university financial infrastructure.</span>
            <span className="hidden sm:inline">© 2024 CampusChain. All rights reserved.</span>
          </p>
        </div>
        <div className="hidden gap-8 md:flex">
          <a
            href="https://github.com/sandipansingh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold tracking-[0.05em] text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
        <p className="text-center text-xs font-medium text-muted-foreground/75 sm:hidden">
          © 2024 CampusChain. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
