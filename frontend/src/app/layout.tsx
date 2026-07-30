import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TransactionStatusToast } from "@/shared/ui/TransactionStatusToast";
import { ContractEventStreamController } from "@/shared/ui/ContractEventStreamController";

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
