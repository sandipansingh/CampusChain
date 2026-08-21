import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TransactionStatusToast } from "@/shared/ui/TransactionStatusToast";
import { ContractEventStreamController } from "@/shared/ui/ContractEventStreamController";

export const metadata: Metadata = {
  title: "CampusChain",
  description:
    "Stellar-powered campus financial and registry platform — on-chain payments, escrow, ticketing, scholarships, and identity in one unified campus economy.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "CampusChain",
    description:
      "Stellar-powered campus financial and registry platform — payments, escrow, ticketing, scholarships & identity on-chain.",
    url: "https://campuschain.sandipansingh.com",
    siteName: "CampusChain",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CampusChain" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusChain",
    description: "Stellar-powered unified campus economy — payments, escrow, ticketing & identity on-chain.",
    images: ["/og-image.png"],
  },
};

const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('campuschain-theme') || 'system';
      var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (_) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers>
          {children}
          <TransactionStatusToast />
          <ContractEventStreamController />
        </Providers>
      </body>
    </html>
  );
}

