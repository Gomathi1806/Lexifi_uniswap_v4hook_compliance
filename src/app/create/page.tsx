"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { encodeAbiParameters, getAddress, isAddress, keccak256, parseUnits, zeroAddress } from "viem";
import { HOOK_ABI, POLICY_CONFIG_ABI } from "@/config/abi";
import { getDeployment, TIERS, ConfigFamily, encodeRegionalConfig } from "@/config/contracts";

/* One-page flow: pick a pair, a price and the rules, then sign three transactions.
 * The order is deliberate (see lexifi-create-pool.sh): claim the rules-registry admin, then the
 * hook admin, and only then create the pool, so nobody can take either admin slot in between. */

type Token = { symbol: string; address: `0x${string}`; decimals: number };

const TOKENS: Record<number, Token[]> = {
  8453: [
    { symbol: "ETH", address: zeroAddress, decimals: 18 },
    { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  ],
  4663: [
    { symbol: "ETH", address: zeroAddress, decimals: 18 },
    { symbol: "USDG", address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", decimals: 6 },
  ],
};

const FEES = [
  { fee: 500, tickSpacing: 10, label: "0.05%" },
  { fee: 3000, tickSpacing: 60, label: "0.30%" },
  { fee: 10000, tickSpacing: 200, label: "1.00%" },
];

const POOL_MANAGER_ABI = [
  {
    type: "function",
    name: "initialize",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "sqrtPriceX96", type: "uint160" },
    ],
    outputs: [{ name: "tick", type: "int24" }],
  },
] as const;

const ERC20_ABI = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

const MIN_SQRT = 4295128739n;
const MAX_SQRT = 1461446703485210103287273052203988822378723970342n;

function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n, y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + n / x) / 2n; }
  return x;
}

/** price = amount of currency1 for one currency0, in human units */
function sqrtPriceX96(price: string, d0: number, d1: number): bigint | undefined {
  try {
    const num = parseUnits(price, 18);
    if (num <= 0n) return undefined;
    let n = num * (1n << 192n), den = 10n ** 18n;
    if (d1 >= d0) n *= 10n ** BigInt(d1 - d0); else den *= 10n ** BigInt(d0 - d1);
    const s = isqrt(n / den);
    return s > MIN_SQRT && s < MAX_SQRT ? s : undefined;
  } catch {
    return undefined;
  }
}

type StepState = "idle" | "wallet" | "mining" | "done" | "skipped" | "error";
const STEPS = [
  { title: "Set your rules", sub: "Writes the rules to LexifiPolicyConfig and makes you their admin" },
  { title: "Attach Lexifi to the pool", sub: "LexifiHook.setPoolPolicy makes you the pool admin on the hook" },
  { title: "Create the Uniswap v4 pool", sub: "PoolManager.initialize at your starting price" },
];

export default function CreatePoolPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const d = getDeployment(chainId);
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const supported = chainId === 8453 || chainId === 4663;
  const tokens = TOKENS[chainId] ?? TOKENS[8453];
  const networkName = chainId === 4663 ? "Robinhood Chain" : chainId === 8453 ? "Base" : "this network";

  const [aSel, setASel] = useState("ETH");
  const [bSel, setBSel] = useState(chainId === 4663 ? "USDG" : "USDC");
  const [customA, setCustomA] = useState<Token | null>(null);
  const [customB, setCustomB] = useState<Token | null>(null);
  const [price, setPrice] = useState("4000");
  const [feeIdx, setFeeIdx] = useState(1);
  const [requireCountry, setRequireCountry] = useState(true);
  const [swapMin, setSwapMin] = useState(2);
  const [lpMin, setLpMin] = useState(2);

  const [steps, setSteps] = useState<StepState[]>(["idle", "idle", "idle"]);
  const [txs, setTxs] = useState<(string | undefined)[]>([]);
  const [error, setError] = useState<string>();
  const [taken, setTaken] = useState<string | null>(null);
  const [admins, setAdmins] = useState<{ hook: string; registry: string }>();

  useEffect(() => {
    setBSel(chainId === 4663 ? "USDG" : "USDC");
    setSteps(["idle", "idle", "idle"]);
    setTxs([]);
  }, [chainId]);

  const tokA = aSel === "custom" ? customA : tokens.find((t) => t.symbol === aSel) ?? null;
  const tokB = bSel === "custom" ? customB : tokens.find((t) => t.symbol === bSel) ?? null;
  const { fee, tickSpacing } = FEES[feeIdx];

  // Uniswap orders the pair by address; the price the user typed is "B per A".
  const derived = useMemo(() => {
    if (!tokA || !tokB || tokA.address.toLowerCase() === tokB.address.toLowerCase()) return undefined;
    const flip = tokA.address.toLowerCase() > tokB.address.toLowerCase();
    const [t0, t1] = flip ? [tokB, tokA] : [tokA, tokB];
    let p = price;
    if (flip) {
      const n = Number(price);
      if (!(n > 0)) return undefined;
      p = (1 / n).toPrecision(18).replace(/\.?0+$/, "");
    }
    const sqrt = sqrtPriceX96(p, t0.decimals, t1.decimals);
    const key = { currency0: t0.address, currency1: t1.address, fee, tickSpacing, hooks: d.hook };
    const poolId = keccak256(
      encodeAbiParameters(
        [{ type: "address" }, { type: "address" }, { type: "uint24" }, { type: "int24" }, { type: "address" }],
        [key.currency0, key.currency1, fee, tickSpacing, d.hook],
      ),
    );
    return { key, poolId, sqrt, t0, t1 };
  }, [tokA, tokB, price, fee, tickSpacing, d.hook]);

  // Is someone else already the admin of this pool id?
  useEffect(() => {
    setTaken(null);
    if (!client || !derived || !address) return;
    let live = true;
    Promise.all([
      client.readContract({ address: d.hook, abi: HOOK_ABI, functionName: "poolAdmin", args: [derived.poolId] }),
      client.readContract({ address: d.policyConfig, abi: POLICY_CONFIG_ABI, functionName: "poolAdmin", args: [ConfigFamily.regional, derived.poolId] }),
    ]).then((xs) => {
      if (!live) return;
      const other = (xs as string[]).find((x) => x !== zeroAddress && x.toLowerCase() !== address.toLowerCase());
      setTaken(other ?? null);
    }).catch(() => {});
    return () => { live = false; };
  }, [client, derived?.poolId, address, d.hook, d.policyConfig]);

  const loadCustom = async (addr: string, set: (t: Token | null) => void) => {
    set(null);
    if (!client || !isAddress(addr)) return;
    try {
      const a = getAddress(addr);
      const [decimals, symbol] = await Promise.all([
        client.readContract({ address: a, abi: ERC20_ABI, functionName: "decimals" }),
        client.readContract({ address: a, abi: ERC20_ABI, functionName: "symbol" }),
      ]);
      set({ symbol: symbol as string, address: a, decimals: Number(decimals) });
    } catch {
      setError("That address is not an ERC-20 token on " + networkName);
    }
  };

  const mark = (i: number, s: StepState) => setSteps((p) => p.map((x, j) => (j === i ? s : x)));
  const busy = steps.some((s) => s === "wallet" || s === "mining");
  const allDone = steps.every((s) => s === "done" || s === "skipped");

  const run = async () => {
    if (!client || !derived?.sqrt || !address) return;
    setError(undefined);
    const { key, poolId, sqrt } = derived;
    const cfg = encodeRegionalConfig({
      requireCountryAttestation: requireCountry,
      requireAccountAttestation: false,
      minimumSwapLevel: swapMin,
      minimumLpLevel: Math.max(lpMin, swapMin),
    });
    const send = async (i: number, fn: () => Promise<`0x${string}`>) => {
      if (steps[i] === "done") return;
      mark(i, "wallet");
      const hash = await fn();
      setTxs((p) => { const n = [...p]; n[i] = hash; return n; });
      mark(i, "mining");
      const r = await client.waitForTransactionReceipt({ hash });
      if (r.status !== "success") throw new Error("Transaction reverted: " + hash);
      mark(i, "done");
    };
    let i = 0;
    try {
      await send(0, () => writeContractAsync({ address: d.policyConfig, abi: POLICY_CONFIG_ABI, functionName: "setConfig", args: [ConfigFamily.regional, poolId, cfg] }));
      i = 1;
      await send(1, () => writeContractAsync({ address: d.hook, abi: HOOK_ABI, functionName: "setPoolPolicy", args: [key, d.regionalPolicy] }));
      i = 2;
      let exists = false;
      try {
        await client.simulateContract({ account: address, address: d.poolManager, abi: POOL_MANAGER_ABI, functionName: "initialize", args: [key, sqrt] });
      } catch { exists = true; }
      if (exists) mark(2, "skipped");
      else await send(2, () => writeContractAsync({ address: d.poolManager, abi: POOL_MANAGER_ABI, functionName: "initialize", args: [key, sqrt] }));
      const [hook, registry] = await Promise.all([
        client.readContract({ address: d.hook, abi: HOOK_ABI, functionName: "poolAdmin", args: [poolId] }),
        client.readContract({ address: d.policyConfig, abi: POLICY_CONFIG_ABI, functionName: "poolAdmin", args: [ConfigFamily.regional, poolId] }),
      ]);
      setAdmins({ hook: hook as string, registry: registry as string });
    } catch (e) {
      mark(i, "error");
      const msg = (e as { shortMessage?: string; message?: string }).shortMessage ?? (e as Error).message;
      setError(msg.slice(0, 200));
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <h1 className="mb-2 font-display text-2xl font-bold text-slate-100">Create a compliant pool</h1>
        <p className="mb-6 max-w-md text-sm text-slate-500">
          Launch a Uniswap v4 pool where only verified wallets can trade or add liquidity. Three signatures, about a minute, a few cents of gas. No liquidity needed to create it.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Switch your wallet to Base or Robinhood Chain to create a pool.
      </div>
    );
  }

  const label = "mb-1.5 block text-[10px] uppercase tracking-widest text-slate-600";
  const input = "w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30";
  const explorerTx = (h: string) => `${d.explorer}/tx/${h}`;
  const nameA = tokA?.symbol ?? "A";
  const nameB = tokB?.symbol ?? "B";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100">Create a compliant pool</h1>
        <p className="mt-1 text-xs text-slate-500">
          On {networkName}. You become the pool admin: only you can change its rules later.
        </p>
      </div>

      {/* 1. Pair */}
      <section className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-200"><span className="mr-2 text-lex-cyan">1</span>Pair and starting price</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { v: aSel, set: setASel, custom: customA, setCustom: setCustomA, l: "Token A" },
            { v: bSel, set: setBSel, custom: customB, setCustom: setCustomB, l: "Token B" },
          ].map((s) => (
            <div key={s.l}>
              <label className={label}>{s.l}</label>
              <select value={s.v} onChange={(e) => s.set(e.target.value)} className={input}>
                {tokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                <option value="custom">Other token (paste address)</option>
              </select>
              {s.v === "custom" && (
                <input placeholder="0x… token address" onChange={(e) => loadCustom(e.target.value.trim(), s.setCustom)} className={`${input} mt-2`} />
              )}
              {s.v === "custom" && s.custom && <p className="mt-1 text-[11px] text-lex-green">{s.custom.symbol} · {s.custom.decimals} decimals</p>}
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className={label}>Starting price: {nameB} per 1 {nameA}</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className={input} inputMode="decimal" />
          </div>
          <div>
            <label className={label}>Fee tier</label>
            <div className="flex gap-2">
              {FEES.map((f, i) => (
                <button key={f.fee} onClick={() => setFeeIdx(i)}
                  className={`flex-1 rounded-lg border py-2.5 text-xs font-semibold ${feeIdx === i ? "border-lex-cyan/30 bg-lex-cyan/10 text-lex-cyan" : "border-white/[0.06] bg-base-0 text-slate-500 hover:text-slate-300"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {taken && (
          <p className="mt-3 rounded-lg bg-lex-amber/10 px-3 py-2 text-xs text-lex-amber">
            This pair and fee already belong to another admin ({taken.slice(0, 6)}…{taken.slice(-4)}). Pick a different fee tier.
          </p>
        )}
        {derived && !derived.sqrt && <p className="mt-3 text-xs text-lex-red">Enter a price greater than zero.</p>}
      </section>

      {/* 2. Rules */}
      <section className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-200"><span className="mr-2 text-lex-cyan">2</span>Who may use it</h2>
        <p className="mb-4 text-[11px] text-slate-500">
          {chainId === 4663
            ? "Identity on Robinhood Chain comes from Lexifi's attestation registry: verified wallets are recorded on-chain by the operator."
            : "Identity on Base comes from Coinbase Verifications (on-chain KYC attestations)."}
        </p>
        <label className="mb-3 flex cursor-pointer items-center gap-3 text-xs text-slate-300">
          <input type="checkbox" checked={requireCountry} onChange={(e) => setRequireCountry(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
          Require a verified country of residence
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { l: "To swap, a wallet needs at least", v: swapMin, set: setSwapMin },
            { l: "To add liquidity, at least", v: lpMin, set: setLpMin },
          ].map((s) => (
            <div key={s.l}>
              <label className={label}>{s.l}</label>
              <select value={s.v} onChange={(e) => s.set(parseInt(e.target.value))} className={input}>
                {TIERS.map((t, i) => i > 0 && <option key={i} value={i}>{t.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Sign */}
      <section className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-200"><span className="mr-2 text-lex-cyan">3</span>Sign three transactions</h2>
        <ol className="space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-base-0 p-3">
              <StepIcon state={steps[i]} n={i + 1} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200">{s.title}</div>
                <div className="text-[11px] text-slate-500">
                  {steps[i] === "wallet" ? "Confirm in your wallet…" : steps[i] === "mining" ? "Waiting for the block…" : steps[i] === "skipped" ? "Pool already exists, skipped" : s.sub}
                </div>
              </div>
              {txs[i] && (
                <a href={explorerTx(txs[i]!)} target="_blank" rel="noreferrer" className="shrink-0 font-mono text-[11px] text-lex-cyan">
                  {txs[i]!.slice(0, 8)}… ↗
                </a>
              )}
            </li>
          ))}
        </ol>
        {derived && (
          <p className="mt-3 break-all font-mono text-[10px] text-slate-600">
            Pool {derived.t0.symbol}/{derived.t1.symbol} · {FEES[feeIdx].label} · id {derived.poolId}
          </p>
        )}
        {!allDone && (
          <button onClick={run} disabled={busy || !derived?.sqrt || !!taken}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-lex-cyan to-cyan-600 py-3 text-sm font-bold text-base-0 transition-opacity hover:opacity-90 disabled:opacity-40">
            {busy ? "Working…" : taken ? "Pick another fee tier" : steps.some((s) => s === "error") ? "Retry" : "Create pool"}
          </button>
        )}
        {error && <p className="mt-2 rounded-lg bg-lex-red/10 px-3 py-2 text-xs text-lex-red">{error}</p>}
      </section>

      {allDone && derived && (
        <section className="rounded-xl border border-lex-green/20 bg-lex-green/[0.04] p-5">
          <h2 className="mb-2 text-sm font-bold text-lex-green">Your compliant pool is live</h2>
          <div className="space-y-1 font-mono text-[11px] text-slate-400">
            <div>Hook admin: <span className="text-slate-200">{admins?.hook}</span></div>
            <div>Rules admin: <span className="text-slate-200">{admins?.registry}</span></div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Unverified wallets are now rejected when they swap or add liquidity. Try any wallet in the{" "}
            <Link href="/checker" className="text-lex-cyan">Checker</Link>, or see every decision in the{" "}
            <Link href="/audit" className="text-lex-cyan">Audit Trail</Link>.
          </p>
          {txs[1] && (
            <a href={explorerTx(txs[1])} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-lex-cyan">
              Proof you created it: PoolPolicySet event ↗
            </a>
          )}
        </section>
      )}
    </div>
  );
}

function StepIcon({ state, n }: { state: StepState; n: number }) {
  const base = "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold";
  if (state === "done" || state === "skipped") return <div className={`${base} bg-lex-green/15 text-lex-green`}>✓</div>;
  if (state === "error") return <div className={`${base} bg-lex-red/15 text-lex-red`}>!</div>;
  if (state === "wallet" || state === "mining") return <div className={`${base} animate-pulse bg-lex-cyan/20 text-lex-cyan`}>{n}</div>;
  return <div className={`${base} bg-white/[0.05] text-slate-500`}>{n}</div>;
}
