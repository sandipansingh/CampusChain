import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TransactionStatusToast } from "@/shared/ui/TransactionStatusToast";
import { ContractEventStreamController } from "@/shared/ui/ContractEventStreamController";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusChain",
  description: "Stellar-powered campus financial and registry platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          {children}
          <TransactionStatusToast />
          <ContractEventStreamController />
        </Providers>
      </body>
    </html>
  );
}
