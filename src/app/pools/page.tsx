"use client";

import { useState, useMemo } from "react";
import { useAccount, useChainId, useWriteContract, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  HOOK_ABI,
  THRESHOLD_POLICY_ABI,
  REGIONAL_POLICY_ABI,
  INSTITUTIONAL_POLICY_ABI,
} from "@/config/abi";
import { getDeployment, TIERS } from "@/config/contracts";
import { encodeAbiParameters, keccak256 } from "viem";

const LEVEL_OPTIONS = TIERS.map((t, i) => ({ value: i, label: t.label }));

function computePoolId(
  currency0: `0x${string}`,
  currency1: `0x${string}`,
  fee: number,
  tickSpacing: number,
  hooks: `0x${string}`,
): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "uint24" },
        { type: "int24" },
        { type: "address" },
      ],
      [currency0, currency1, fee, tickSpacing, hooks],
    ),
  );
}

export default function PoolsPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const d = getDeployment(chainId);
  const register = useWriteContract();
  const configure = useWriteContract();

  // Pool key
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

  // Regional config
  const [requireCountry, setRequireCountry] = useState(true);
  const [requireAccount, setRequireAccount] = useState(false);
  const [regSwapMin, setRegSwapMin] = useState("1");
  const [regLpMin, setRegLpMin] = useState("1");

  // Institutional config
  const [providers, setProviders] = useState(d.coinbaseProvider as string);
  const [minProviders, setMinProviders] = useState("1");
  const [minTier, setMinTier] = useState("2");

  // Lookup
  const [lookupToken0, setLookupToken0] = useState("");
  const [lookupToken1, setLookupToken1] = useState("");

  const policyAddress =
    selectedPolicy === "threshold"
      ? d.thresholdPolicy
      : selectedPolicy === "regional"
        ? d.regionalPolicy
        : d.institutionalPolicy;

  const poolKey = {
    currency0: token0 as `0x${string}`,
    currency1: token1 as `0x${string}`,
    fee: parseInt(fee),
    tickSpacing: parseInt(tickSpacing),
    hooks: d.hook,
  };

  const poolId = useMemo(() => {
    try {
      return computePoolId(
        poolKey.currency0,
        poolKey.currency1,
        poolKey.fee,
        poolKey.tickSpacing,
        poolKey.hooks,
      );
    } catch {
      return undefined;
    }
  }, [token0, token1, fee, tickSpacing, d.hook]);

  // Read current config
  const { data: thresholdConfig, refetch: refetchThreshold } = useReadContract({
    address: d.thresholdPolicy,
    abi: THRESHOLD_POLICY_ABI,
    functionName: "configs",
    args: poolId ? [poolId] : undefined,
    query: { enabled: !!poolId && selectedPolicy === "threshold" },
  });

  const { data: regionalConfig, refetch: refetchRegional } = useReadContract({
    address: d.regionalPolicy,
    abi: REGIONAL_POLICY_ABI,
    functionName: "regionConfigs",
    args: poolId ? [poolId] : undefined,
    query: { enabled: !!poolId && selectedPolicy === "regional" },
  });

  const { data: institutionalConfig, refetch: refetchInstitutional } = useReadContract({
    address: d.institutionalPolicy,
    abi: INSTITUTIONAL_POLICY_ABI,
    functionName: "getConfig",
    args: poolId ? [poolId] : undefined,
    query: { enabled: !!poolId && selectedPolicy === "institutional" },
  });

  const handleRegister = () => {
    register.writeContract({
      address: d.hook,
      abi: HOOK_ABI,
      functionName: "setPoolPolicy",
      args: [poolKey, policyAddress],
    });
  };

  const handleConfigure = () => {
    if (!poolId) return;

    if (selectedPolicy === "threshold") {
      configure.writeContract({
        address: d.thresholdPolicy,
        abi: THRESHOLD_POLICY_ABI,
        functionName: "setPoolConfig",
        args: [
          poolId,
          BigInt(noKycLimit) * 10n ** 18n,
          BigInt(enhancedLimit) * 10n ** 18n,
          parseInt(lpMin),
          parseInt(swapMin),
        ],
      });
    } else if (selectedPolicy === "regional") {
      configure.writeContract({
        address: d.regionalPolicy,
        abi: REGIONAL_POLICY_ABI,
        functionName: "setRegionConfig",
        args: [
          poolId,
          requireCountry,
          requireAccount,
          parseInt(regSwapMin),
          parseInt(regLpMin),
        ],
      });
    } else {
      const providerList = providers
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean) as `0x${string}`[];
      configure.writeContract({
        address: d.institutionalPolicy,
        abi: INSTITUTIONAL_POLICY_ABI,
        functionName: "setInstitutionalConfig",
        args: [poolId, providerList, BigInt(minProviders), parseInt(minTier)],
      });
    }
  };

  const handleLoadConfig = () => {
    if (selectedPolicy === "threshold") refetchThreshold();
    else if (selectedPolicy === "regional") refetchRegional();
    else refetchInstitutional();
  };

  // Lookup pool
  const lookupKey =
    lookupToken0 && lookupToken1
      ? {
          currency0: lookupToken0 as `0x${string}`,
          currency1: lookupToken1 as `0x${string}`,
          fee: 3000,
          tickSpacing: 60,
          hooks: d.hook,
        }
      : undefined;

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
        <p className="mb-4 text-[11px] text-slate-500">
          Assign a compliance policy to a Uniswap V4 pool. The pool key is (token0, token1, fee, tickSpacing, hook).
        </p>

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
              <button
                key={p.k}
                onClick={() => setSelectedPolicy(p.k)}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                  selectedPolicy === p.k
                    ? "border-lex-cyan/30 bg-lex-cyan/10 text-lex-cyan"
                    : "border-white/[0.06] bg-base-0 text-slate-500 hover:text-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/[0.04] bg-base-0 p-3 font-mono text-[11px] text-slate-500">
          Policy: <span className="text-slate-300">{policyAddress.slice(0, 14)}...{policyAddress.slice(-8)}</span>
          {poolId && (
            <>
              <br />
              Pool ID: <span className="text-lex-cyan">{poolId.slice(0, 14)}...{poolId.slice(-8)}</span>
            </>
          )}
        </div>

        <button
          onClick={handleRegister}
          disabled={register.isPending}
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-lex-cyan to-cyan-600 py-3 text-sm font-bold text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {register.isPending ? "Confirming..." : "Register Policy on Pool"}
        </button>

        {register.isSuccess && <div className="mt-2 rounded-lg bg-lex-green/10 px-3 py-2 text-xs text-lex-green">Policy registered successfully!</div>}
        {register.error && <div className="mt-2 rounded-lg bg-lex-red/10 px-3 py-2 text-xs text-lex-red">{(register.error as Error).message.slice(0, 120)}</div>}
      </div>

      {/* Configure Policy */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-sm font-bold text-slate-200">Configure Policy</h2>
            <p className="text-[11px] text-slate-500">
              Set parameters for the {selectedPolicy} policy on this pool.
              {poolId && (
                <span className="ml-1 font-mono text-lex-cyan">{poolId.slice(0, 10)}...</span>
              )}
            </p>
          </div>
          <button
            onClick={handleLoadConfig}
            className="rounded-lg border border-white/[0.06] bg-base-0 px-3 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            Load Current
          </button>
        </div>

        {selectedPolicy === "threshold" && (
          <ThresholdForm
            noKycLimit={noKycLimit}
            setNoKycLimit={setNoKycLimit}
            enhancedLimit={enhancedLimit}
            setEnhancedLimit={setEnhancedLimit}
            swapMin={swapMin}
            setSwapMin={setSwapMin}
            lpMin={lpMin}
            setLpMin={setLpMin}
            currentConfig={thresholdConfig as any}
          />
        )}

        {selectedPolicy === "regional" && (
          <RegionalForm
            requireCountry={requireCountry}
            setRequireCountry={setRequireCountry}
            requireAccount={requireAccount}
            setRequireAccount={setRequireAccount}
            regSwapMin={regSwapMin}
            setRegSwapMin={setRegSwapMin}
            regLpMin={regLpMin}
            setRegLpMin={setRegLpMin}
            currentConfig={regionalConfig as any}
          />
        )}

        {selectedPolicy === "institutional" && (
          <InstitutionalForm
            providers={providers}
            setProviders={setProviders}
            minProviders={minProviders}
            setMinProviders={setMinProviders}
            minTier={minTier}
            setMinTier={setMinTier}
            currentConfig={institutionalConfig as any}
          />
        )}

        <button
          onClick={handleConfigure}
          disabled={configure.isPending || !poolId}
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-lex-violet to-violet-600 py-3 text-sm font-bold text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {configure.isPending ? "Confirming..." : `Set ${selectedPolicy[0].toUpperCase() + selectedPolicy.slice(1)} Config`}
        </button>

        {configure.isSuccess && <div className="mt-2 rounded-lg bg-lex-green/10 px-3 py-2 text-xs text-lex-green">Policy configured successfully!</div>}
        {configure.error && <div className="mt-2 rounded-lg bg-lex-red/10 px-3 py-2 text-xs text-lex-red">{(configure.error as Error).message.slice(0, 120)}</div>}
      </div>

      {/* Lookup Pool */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-200">Lookup Pool Compliance</h2>
        <p className="mb-4 text-[11px] text-slate-500">Check if a pool has a compliance policy registered.</p>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={lookupToken0}
            onChange={(e) => setLookupToken0(e.target.value)}
            placeholder="Token 0 address"
            className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30"
          />
          <input
            value={lookupToken1}
            onChange={(e) => setLookupToken1(e.target.value)}
            placeholder="Token 1 address"
            className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30"
          />
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

/* ─── Threshold Config Form ────────────────────────────────────────── */
function ThresholdForm({
  noKycLimit, setNoKycLimit,
  enhancedLimit, setEnhancedLimit,
  swapMin, setSwapMin,
  lpMin, setLpMin,
  currentConfig,
}: {
  noKycLimit: string; setNoKycLimit: (v: string) => void;
  enhancedLimit: string; setEnhancedLimit: (v: string) => void;
  swapMin: string; setSwapMin: (v: string) => void;
  lpMin: string; setLpMin: (v: string) => void;
  currentConfig?: readonly [bigint, bigint, number, number, boolean];
}) {
  return (
    <div className="space-y-3">
      {currentConfig && currentConfig[4] && (
        <CurrentConfigBadge>
          noKycLimit: {(currentConfig[0] / 10n ** 18n).toString()} |
          enhancedLimit: {(currentConfig[1] / 10n ** 18n).toString()} |
          swapMin: {TIERS[currentConfig[3]]?.label ?? currentConfig[3]} |
          lpMin: {TIERS[currentConfig[2]]?.label ?? currentConfig[2]}
        </CurrentConfigBadge>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">No-KYC Limit (tokens)</label>
          <input value={noKycLimit} onChange={(e) => setNoKycLimit(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Enhanced Limit (tokens)</label>
          <input value={enhancedLimit} onChange={(e) => setEnhancedLimit(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
        </div>
        <LevelSelect label="Swap Minimum Level" value={swapMin} onChange={setSwapMin} />
        <LevelSelect label="LP Minimum Level" value={lpMin} onChange={setLpMin} />
      </div>
    </div>
  );
}

/* ─── Regional Config Form ─────────────────────────────────────────── */
function RegionalForm({
  requireCountry, setRequireCountry,
  requireAccount, setRequireAccount,
  regSwapMin, setRegSwapMin,
  regLpMin, setRegLpMin,
  currentConfig,
}: {
  requireCountry: boolean; setRequireCountry: (v: boolean) => void;
  requireAccount: boolean; setRequireAccount: (v: boolean) => void;
  regSwapMin: string; setRegSwapMin: (v: string) => void;
  regLpMin: string; setRegLpMin: (v: string) => void;
  currentConfig?: readonly [boolean, boolean, number, number, boolean];
}) {
  return (
    <div className="space-y-3">
      {currentConfig && currentConfig[4] && (
        <CurrentConfigBadge>
          country: {currentConfig[0] ? "required" : "off"} |
          account: {currentConfig[1] ? "required" : "off"} |
          swapMin: {TIERS[currentConfig[2]]?.label ?? currentConfig[2]} |
          lpMin: {TIERS[currentConfig[3]]?.label ?? currentConfig[3]}
        </CurrentConfigBadge>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Toggle label="Require Country Attestation" checked={requireCountry} onChange={setRequireCountry} />
        <Toggle label="Require Account Attestation" checked={requireAccount} onChange={setRequireAccount} />
        <LevelSelect label="Swap Minimum Level" value={regSwapMin} onChange={setRegSwapMin} />
        <LevelSelect label="LP Minimum Level" value={regLpMin} onChange={setRegLpMin} />
      </div>
    </div>
  );
}

/* ─── Institutional Config Form ────────────────────────────────────── */
function InstitutionalForm({
  providers, setProviders,
  minProviders, setMinProviders,
  minTier, setMinTier,
  currentConfig,
}: {
  providers: string; setProviders: (v: string) => void;
  minProviders: string; setMinProviders: (v: string) => void;
  minTier: string; setMinTier: (v: string) => void;
  currentConfig?: readonly [`0x${string}`[], bigint, number, boolean];
}) {
  return (
    <div className="space-y-3">
      {currentConfig && currentConfig[3] && (
        <CurrentConfigBadge>
          providers: {(currentConfig[0] as `0x${string}`[]).length} |
          minProviders: {currentConfig[1].toString()} |
          minTier: {TIERS[currentConfig[2]]?.label ?? currentConfig[2]}
        </CurrentConfigBadge>
      )}
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">
          Verification Providers (comma-separated addresses)
        </label>
        <textarea
          value={providers}
          onChange={(e) => setProviders(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30"
          placeholder="0xaddr1, 0xaddr2"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Minimum Providers Required</label>
          <input value={minProviders} onChange={(e) => setMinProviders(e.target.value)} className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
        </div>
        <LevelSelect label="Minimum Tier" value={minTier} onChange={setMinTier} />
      </div>
    </div>
  );
}

/* ─── Shared small components ──────────────────────────────────────── */
function LevelSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-lex-cyan/30"
      >
        {LEVEL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value} — {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-lex-cyan" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
      <span className="text-xs text-slate-300">{label}</span>
    </div>
  );
}

function CurrentConfigBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-lex-cyan/10 bg-lex-cyan/5 px-3 py-2 font-mono text-[11px] text-lex-cyan">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-lex-cyan/60">ON-CHAIN</span>
      {children}
    </div>
  );
}
