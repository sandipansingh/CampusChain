import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import AppShell from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusChain – Unified Campus Economy",
  description:
    "Instant merchant payments, P2P transfers, rewards token distribution, marketplace escrow, and digital ticketing powered by Stellar/Soroban.",
  keywords: ["stellar", "soroban", "blockchain", "campus economy", "smart contracts", "payments", "escrow"],
  authors: [{ name: "CampusChain Team" }],
  openGraph: {
    title: "CampusChain – Unified Campus Economy",
    description:
      "Instant merchant payments, P2P transfers, rewards token distribution, marketplace escrow, and digital ticketing powered by Stellar/Soroban.",
    url: "https://campuschain.local",
    siteName: "CampusChain",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusChain – Unified Campus Economy",
    description:
      "Instant merchant payments, P2P transfers, rewards token distribution, marketplace escrow, and digital ticketing powered by Stellar/Soroban.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <div className="noise-overlay" aria-hidden="true" />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
