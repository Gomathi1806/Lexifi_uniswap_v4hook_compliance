"use client";

import { useAccount, useChainId, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { HOOK_ABI, PROVIDER_ABI } from "@/config/abi";
import { getDeployment, DEPLOYMENTS, TIERS, POLICIES } from "@/config/contracts";
import Link from "next/link";

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const d = getDeployment(chainId);

  const { data: totalPools } = useReadContract({ address: d.hook, abi: HOOK_ABI, functionName: "totalPools" });
  const { data: totalChecks } = useReadContract({ address: d.hook, abi: HOOK_ABI, functionName: "totalChecks" });
  const { data: hookOwner } = useReadContract({ address: d.hook, abi: HOOK_ABI, functionName: "owner" });
  const { data: requireApproval } = useReadContract({ address: d.hook, abi: HOOK_ABI, functionName: "requireApproval" });

  const isOwner = hookOwner && address && (hookOwner as string).toLowerCase() === address.toLowerCase();
  const network = chainId === 84532 ? "Base Sepolia" : "Base Mainnet";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-lex-cyan/20 to-lex-violet/20 font-mono text-2xl text-lex-cyan">L</div>
        <h1 className="mb-2 font-display text-2xl font-bold text-slate-100">Lexifi Operator Dashboard</h1>
        <p className="mb-6 max-w-md text-sm text-slate-500">Pool-level compliance infrastructure for Uniswap V4. Connect your wallet to manage policies, check compliance, and monitor pools.</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="mt-0.5 text-xs text-slate-500">{network} · {isOwner ? "Hook Owner" : "Operator"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/pools" className="rounded-lg bg-lex-cyan/10 px-3.5 py-2 text-xs font-semibold text-lex-cyan no-underline transition-colors hover:bg-lex-cyan/20">Register Pool →</Link>
          <Link href="/checker" className="rounded-lg bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-400 no-underline transition-colors hover:bg-white/[0.08]">Check Wallet</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Compliant Pools" value={totalPools?.toString() ?? "–"} accent />
        <Stat label="Total Checks" value={totalChecks?.toString() ?? "–"} />
        <Stat label="Policy Templates" value="3" />
        <Stat label="Approval Required" value={requireApproval ? "Yes" : "No"} />
      </div>

      {/* Deployed Contracts */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-200">Deployed Contracts</h2>
        <div className="space-y-1 font-mono text-[11px]">
          <AddrRow label="LexifiHook" addr={d.hook} explorer={d.explorer} highlight />
          <AddrRow label="CoinbaseEASProvider" addr={d.coinbaseProvider} explorer={d.explorer} />
          <AddrRow label="ThresholdPolicy" addr={d.thresholdPolicy} explorer={d.explorer} />
          <AddrRow label="RegionalPolicy" addr={d.regionalPolicy} explorer={d.explorer} />
          <AddrRow label="InstitutionalPolicy" addr={d.institutionalPolicy} explorer={d.explorer} />
          <AddrRow label="PoolManager" addr={d.poolManager} explorer={d.explorer} />
        </div>
      </div>

      {/* Policy Templates */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-200">Available Policy Templates</h2>
        <div className="grid gap-2.5 md:grid-cols-3">
          {POLICIES.map((p) => (
            <div key={p.key} className="rounded-lg border border-white/[0.04] bg-base-0 p-4">
              <div className="mb-1 text-xs font-bold text-slate-200">{p.name}</div>
              <div className="text-[11px] leading-relaxed text-slate-500">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Reference */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-200">Compliance Tiers</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TIERS.map((t, i) => (
            <div key={t.name} className="rounded-lg border border-white/[0.04] bg-base-0 p-3 text-center">
              <div className="mb-0.5 font-mono text-lg font-bold" style={{ color: t.color }}>{i}</div>
              <div className="text-xs font-bold" style={{ color: t.color }}>{t.name}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-base-1 p-4">
      <div className="text-[10px] uppercase tracking-widest text-slate-600">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold ${accent ? "text-lex-cyan" : "text-slate-200"}`}>{value}</div>
    </div>
  );
}

function AddrRow({ label, addr, explorer, highlight }: { label: string; addr: string; explorer: string; highlight?: boolean }) {
  if (!addr) return null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={highlight ? "text-lex-cyan" : "text-slate-400"}>{label}</span>
      <a href={`${explorer}/address/${addr}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 no-underline transition-colors hover:text-lex-cyan">
        {addr.slice(0, 14)}…{addr.slice(-8)} ↗
      </a>
    </div>
  );
}
