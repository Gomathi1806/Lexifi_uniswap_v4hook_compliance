"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReadContract, useChainId } from "wagmi";
import { HOOK_ABI } from "@/config/abi";
import { getDeployment } from "@/config/contracts";

const NAV = [
  { href: "/", label: "Overview", icon: "◈" },
  { href: "/pools", label: "Pools", icon: "◉" },
  { href: "/checker", label: "Checker", icon: "⊘" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Nav() {
  const path = usePathname();
  const chainId = useChainId();
  const d = getDeployment(chainId);

  const { data: totalPools } = useReadContract({
    address: d.hook, abi: HOOK_ABI, functionName: "totalPools",
  });
  const { data: totalChecks } = useReadContract({
    address: d.hook, abi: HOOK_ABI, functionName: "totalChecks",
  });

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-base-0/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-lex-cyan to-cyan-600 font-mono text-xs font-bold text-base-0">L</div>
            <span className="text-sm font-bold tracking-tight text-slate-100">Lexifi</span>
            <span className="rounded bg-lex-cyan/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-lex-cyan">OPERATOR</span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium no-underline transition-all ${path === n.href ? "bg-white/[0.06] text-slate-100" : "text-slate-500 hover:text-slate-300"}`}>
                <span className="text-[10px]">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 font-mono text-[11px] text-slate-500 sm:flex">
            <span>{totalPools?.toString() ?? "–"} pools</span>
            <span className="text-white/[0.08]">|</span>
            <span>{totalChecks?.toString() ?? "–"} checks</span>
          </div>
          <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
        </div>
      </div>
    </header>
  );
}
