"use client";

import { useState } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { HOOK_ABI, PROVIDER_ABI, SELF_ATTESTATION_ABI } from "@/config/abi";
import { getDeployment, TIERS } from "@/config/contracts";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export default function CheckerPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const d = getDeployment(chainId);

  const hasSelfAttest = d.selfAttestationProvider !== ZERO_ADDR;

  const [walletAddr, setWalletAddr] = useState("");
  const [token0, setToken0] = useState("0x4200000000000000000000000000000000000006");
  const [token1, setToken1] = useState("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  const [amount, setAmount] = useState("1000");
  const [operation, setOperation] = useState("0");
  const [submitted, setSubmitted] = useState(false);

  const poolKey = {
    currency0: token0 as `0x${string}`,
    currency1: token1 as `0x${string}`,
    fee: 3000,
    tickSpacing: 60,
    hooks: d.hook,
  };

  const { data: compliance, isLoading: compLoading } = useReadContract({
    address: d.hook,
    abi: HOOK_ABI,
    functionName: "checkUserCompliance",
    args: submitted && walletAddr
      ? [poolKey, walletAddr as `0x${string}`, parseInt(operation), BigInt(Math.floor(parseFloat(amount) * 1e18))]
      : undefined,
    query: { enabled: submitted && !!walletAddr },
  });

  const { data: cbVerification } = useReadContract({
    address: d.coinbaseProvider,
    abi: PROVIDER_ABI,
    functionName: "verify",
    args: submitted && walletAddr ? [walletAddr as `0x${string}`] : undefined,
    query: { enabled: submitted && !!walletAddr },
  });

  const { data: selfVerification } = useReadContract({
    address: d.selfAttestationProvider,
    abi: SELF_ATTESTATION_ABI,
    functionName: "verify",
    args: submitted && walletAddr ? [walletAddr as `0x${string}`] : undefined,
    query: { enabled: submitted && !!walletAddr && hasSelfAttest },
  });

  const allowed = compliance ? (compliance as any)[0] : null;
  const userLevel = compliance ? Number((compliance as any)[1]) : null;
  const requiredLevel = compliance ? Number((compliance as any)[2]) : null;
  const reason = compliance ? (compliance as any)[3] : null;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <h1 className="mb-2 font-display text-xl font-bold text-slate-100">Compliance Checker</h1>
        <p className="mb-5 text-sm text-slate-500">Connect wallet to check any address against pool compliance.</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-100">Compliance Checker</h1>
        <p className="mt-0.5 text-xs text-slate-500">Check any wallet's compliance status for a specific pool and operation.</p>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Wallet Address</label>
            <input
              value={walletAddr}
              onChange={(e) => { setWalletAddr(e.target.value); setSubmitted(false); }}
              placeholder="0x..."
              className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-3 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Operation</label>
              <select
                value={operation}
                onChange={(e) => { setOperation(e.target.value); setSubmitted(false); }}
                className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 text-xs text-slate-300 outline-none"
              >
                <option value="0">Swap</option>
                <option value="1">Add Liquidity</option>
                <option value="2">Remove Liquidity</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Amount (tokens)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setSubmitted(false); }}
                className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Pool Tokens</label>
              <div className="rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-[10px] text-slate-500">WETH / USDC</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSubmitted(true)}
          disabled={!walletAddr}
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-lex-cyan to-cyan-600 py-3 text-sm font-bold text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {compLoading ? "Checking..." : "Check Compliance"}
        </button>
      </div>

      {/* Results */}
      {submitted && compliance && (
        <div className="space-y-3">
          {/* Verdict */}
          <div className={`rounded-xl border p-5 ${allowed ? "border-lex-green/20 bg-lex-green/[0.04]" : "border-lex-red/20 bg-lex-red/[0.04]"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${allowed ? "bg-lex-green/15 text-lex-green" : "bg-lex-red/15 text-lex-red"}`}>
                {allowed ? "✓" : "✗"}
              </div>
              <div>
                <div className={`text-lg font-bold ${allowed ? "text-lex-green" : "text-lex-red"}`}>
                  {allowed ? "COMPLIANT" : "DENIED"}
                </div>
                <div className="text-xs text-slate-500">
                  User tier: <span style={{ color: TIERS[userLevel!]?.color }}>{TIERS[userLevel!]?.name}</span>
                  {" · "}Required: <span style={{ color: TIERS[requiredLevel!]?.color }}>{TIERS[requiredLevel!]?.name}</span>
                </div>
              </div>
            </div>
            {reason && <div className="mt-3 rounded-lg bg-base-0/50 px-3 py-2 font-mono text-xs text-slate-400">{reason}</div>}
          </div>

          {/* Verification Providers */}
          <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-200">Verification Providers</h3>
            <div className={`grid gap-3 ${hasSelfAttest ? "md:grid-cols-2" : ""}`}>
              <ProviderCard label="Coinbase EAS" data={cbVerification as any} color="lex-cyan" />
              {hasSelfAttest && (
                <ProviderCard label="Operator KYC" data={selfVerification as any} color="lex-violet" />
              )}
              {!hasSelfAttest && (
                <div className="rounded-lg border border-dashed border-white/[0.06] bg-base-0 p-4 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-600">Operator KYC</div>
                  <div className="mt-2 text-xs text-slate-500">Not deployed yet</div>
                  <div className="mt-1 text-[10px] text-slate-600">Deploy SelfAttestationProvider to enable</div>
                </div>
              )}
            </div>
          </div>

          {/* Address info */}
          <div className="rounded-lg border border-white/[0.04] bg-base-1 px-4 py-3 font-mono text-[11px] text-slate-500">
            Checked: <span className="text-lex-cyan">{walletAddr}</span> · Operation: {["Swap", "AddLiquidity", "RemoveLiquidity"][parseInt(operation)]} · Amount: {amount} tokens
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderCard({ label, data, color }: { label: string; data: any; color: string }) {
  const verified = data ? (data.verified ?? data[0] ?? null) : null;
  const tier = data ? Number(data.tier ?? data[1] ?? NaN) : null;
  const providerName = data ? (data.providerName ?? data[4] ?? null) : null;

  return (
    <div className="rounded-lg border border-white/[0.04] bg-base-0 p-4">
      <div className={`mb-3 text-xs font-bold text-${color}`}>{label}</div>
      {data ? (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-600">Verified</div>
            <div className={`mt-1 font-mono text-lg font-bold ${verified ? "text-lex-green" : "text-lex-red"}`}>
              {verified ? "Yes" : "No"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-600">Tier</div>
            <div className="mt-1 font-mono text-lg font-bold" style={{ color: TIERS[tier!]?.color }}>
              {tier != null && !isNaN(tier) ? TIERS[tier]?.name ?? tier : "–"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-600">Provider</div>
            <div className="mt-1 text-xs font-bold text-slate-300">{providerName || "–"}</div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500">Loading...</div>
      )}
    </div>
  );
}
