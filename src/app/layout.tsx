import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const ClientShell = dynamic(() => import("@/components/ClientShell"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Lexifi — DEX Operator Dashboard",
  description: "Pool-level compliance infrastructure for Uniswap V4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-body text-slate-300 antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
