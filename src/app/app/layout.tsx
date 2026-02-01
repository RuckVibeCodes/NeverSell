"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";

const Web3Provider = dynamic(
  () => import("@/components/providers/Web3Provider").then((mod) => mod.Web3Provider),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Connecting...</p>
        </div>
      </div>
    ),
  }
);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <AppShell>
        {children}
      </AppShell>
    </Web3Provider>
  );
}
