import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexifi — DEX Operator Dashboard",
  description: "Pool-level compliance infrastructure for Uniswap V4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-body text-slate-300 antialiased">
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-5 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
