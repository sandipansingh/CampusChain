"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWallet } from "@/shared/stellar/useWallet";

import { ThemeProvider } from "@/shared/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const { initialize } = useWallet();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale time
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

