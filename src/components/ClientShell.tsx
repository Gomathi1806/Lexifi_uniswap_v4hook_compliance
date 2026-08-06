"use client";

import { Providers } from "./Providers";
import { Nav } from "./Nav";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-5 py-6">{children}</main>
    </Providers>
  );
}
