"use client";

import { useState } from "react";
import { useAccount, useChainId, useWriteContract, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { HOOK_ABI, THRESHOLD_POLICY_ABI } from "@/config/abi";
import { getDeployment, TIERS } from "@/config/contracts";
import { encodePacked, keccak256 } from "viem";

export default function PoolsPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const d = getDeployment(chainId);
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  // Register Pool form
  const [token0, setToken0] = useState("0x4200000000000000000000000000000000000006");
  const [token1, setToken1] = useState("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  const [fee, setFee] = useState("3000");
  const [tickSpacing, setTickSpacing] = useState("60");
  const [selectedPolicy, setSelectedPolicy] = useState("threshold");

  // Threshold config
  const [noKycLimit, setNoKycLimit] = useState("1000");
  const [enhancedLimit, setEnhancedLimit] = useState("10000");
  const [swapMin, setSwapMin] = useState("1");
  const [lpMin, setLpMin] = useState("1");

  // Lookup
  const [lookupToken0, setLookupToken0] = useState("");
  const [lookupToken1, setLookupToken1] = useState("");

  const policyAddress = selectedPolicy === "threshold" ? d.thresholdPolicy
    : selectedPolicy === "regional" ? d.regionalPolicy
    : d.institutionalPolicy;

  const poolKey = {
    currency0: token0 as `0x${string}`,
    currency1: token1 as `0x${string}`,
    fee: parseInt(fee),
    tickSpacing: parseInt(tickSpacing),
    hooks: d.hook,
  };

  const handleRegister = () => {
    writeContract({
      address: d.hook,
      abi: HOOK_ABI,
      functionName: "setPoolPolicy",
      args: [poolKey, policyAddress],
    });
  };

  // Pool lookup
  const lookupKey = lookupToken0 && lookupToken1 ? {
    currency0: lookupToken0 as `0x${string}`,
    currency1: lookupToken1 as `0x${string}`,
    fee: 3000,
    tickSpacing: 60,
    hooks: d.hook,
  } : undefined;

  const { data: poolInfo } = useReadContract({
    address: d.hook,
    abi: HOOK_ABI,
    functionName: "getPoolInfo",
    args: lookupKey ? [lookupKey] : undefined,
    query: { enabled: !!lookupKey },
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <h1 className="mb-2 font-display text-xl font-bold text-slate-100">Pool Management</h1>
        <p className="mb-5 text-sm text-slate-500">Connect wallet to register compliance policies on pools.</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-slate-100">Pool Management</h1>

      {/* Register Policy */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-200">Register Compliance Policy</h2>
        <p className="mb-4 text-[11px] text-slate-500">Assign a compliance policy to a Uniswap V4 pool. The pool key is (token0, token1, fee, tickSpacing, hook).</p>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Token 0 (Currency0)</label>
            <input value={token0} onChange={(e) => setToken0(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Token 1 (Currency1)</label>
            <input value={token1} onChange={(e) => setToken1(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Fee (bps)</label>
            <input value={fee} onChange={(e) => setFee(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Tick Spacing</label>
            <input value={tickSpacing} onChange={(e) => setTickSpacing(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Policy Template</label>
          <div className="flex gap-2">
            {[
              { k: "threshold", label: "Threshold", color: "lex-cyan" },
              { k: "regional", label: "Regional", color: "lex-violet" },
              { k: "institutional", label: "Institutional", color: "lex-amber" },
            ].map((p) => (
              <button key={p.k} onClick={() => setSelectedPolicy(p.k)}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                  selectedPolicy === p.k
                    ? "border-lex-cyan/30 bg-lex-cyan/10 text-lex-cyan"
                    : "border-white/[0.06] bg-base-0 text-slate-500 hover:text-slate-300"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/[0.04] bg-base-0 p-3 font-mono text-[11px] text-slate-500">
          Policy: <span className="text-slate-300">{policyAddress.slice(0, 14)}…{policyAddress.slice(-8)}</span>
        </div>

        <button onClick={handleRegister} disabled={isPending}
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-lex-cyan to-cyan-600 py-3 text-sm font-bold text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50">
          {isPending ? "Confirming…" : "Register Policy on Pool"}
        </button>

        {isSuccess && <div className="mt-2 rounded-lg bg-lex-green/10 px-3 py-2 text-xs text-lex-green">Policy registered successfully!</div>}
        {error && <div className="mt-2 rounded-lg bg-lex-red/10 px-3 py-2 text-xs text-lex-red">{(error as Error).message.slice(0, 120)}</div>}
      </div>

      {/* Lookup Pool */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-200">Lookup Pool Compliance</h2>
        <p className="mb-4 text-[11px] text-slate-500">Check if a pool has a compliance policy registered.</p>

        <div className="grid gap-3 md:grid-cols-2">
          <input value={lookupToken0} onChange={(e) => setLookupToken0(e.target.value)} placeholder="Token 0 address"
            className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30" />
          <input value={lookupToken1} onChange={(e) => setLookupToken1(e.target.value)} placeholder="Token 1 address"
            className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30" />
        </div>

        {poolInfo && (
          <div className="mt-3 rounded-lg border border-white/[0.04] bg-base-0 p-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${(poolInfo as any)[0] ? "text-lex-green" : "text-slate-500"}`}>
                {(poolInfo as any)[0] ? "● Compliance Active" : "○ No Compliance"}
              </span>
            </div>
            {(poolInfo as any)[0] && (
              <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-500">
                <div>Policy: <span className="text-slate-300">{(poolInfo as any)[2]}</span></div>
                <div>Address: <span className="text-lex-cyan">{(poolInfo as any)[1]}</span></div>
                <div>Admin: <span className="text-slate-300">{(poolInfo as any)[3]}</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
