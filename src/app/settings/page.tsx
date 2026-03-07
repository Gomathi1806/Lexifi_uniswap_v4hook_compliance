"use client";

import { useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { HOOK_ABI, THRESHOLD_POLICY_ABI } from "@/config/abi";
import { getDeployment } from "@/config/contracts";

export default function SettingsPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const d = getDeployment(chainId);
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const { data: hookOwner } = useReadContract({ address: d.hook, abi: HOOK_ABI, functionName: "owner" });
  const { data: requireApproval } = useReadContract({ address: d.hook, abi: HOOK_ABI, functionName: "requireApproval" });

  const isOwner = hookOwner && address && (hookOwner as string).toLowerCase() === address.toLowerCase();

  // Approve policy
  const [approveAddr, setApproveAddr] = useState("");
  // Check if policy approved
  const [checkPolicyAddr, setCheckPolicyAddr] = useState("");

  const { data: isPolicyApproved } = useReadContract({
    address: d.hook, abi: HOOK_ABI, functionName: "approvedPolicies",
    args: checkPolicyAddr ? [checkPolicyAddr as `0x${string}`] : undefined,
    query: { enabled: !!checkPolicyAddr },
  });

  // Configure threshold pool
  const [cfgPoolId, setCfgPoolId] = useState("");
  const [cfgNoKyc, setCfgNoKyc] = useState("1000");
  const [cfgEnhanced, setCfgEnhanced] = useState("10000");
  const [cfgSwapMin, setCfgSwapMin] = useState("1");
  const [cfgLpMin, setCfgLpMin] = useState("1");

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <h1 className="mb-2 font-display text-xl font-bold text-slate-100">Settings</h1>
        <p className="mb-5 text-sm text-slate-500">Connect wallet to manage hook settings.</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-100">Settings</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {isOwner ? "Hook Owner — full admin access" : "Operator — pool-level access only"}
        </p>
      </div>

      {/* Hook Info */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-200">Hook Status</h2>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Hook</span>
            <span className="text-lex-cyan">{d.hook}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Owner</span>
            <span className="text-slate-300">{hookOwner ? `${(hookOwner as string).slice(0, 14)}…${(hookOwner as string).slice(-8)}` : "–"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Approval Required</span>
            <span className={requireApproval ? "text-lex-amber" : "text-lex-green"}>{requireApproval ? "Yes" : "No (Permissionless)"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Your Role</span>
            <span className={isOwner ? "text-lex-amber" : "text-slate-300"}>{isOwner ? "Owner" : "Operator"}</span>
          </div>
        </div>
      </div>

      {/* Owner Functions */}
      {isOwner && (
        <>
          {/* Toggle Approval Mode */}
          <div className="rounded-xl border border-lex-amber/10 bg-base-1 p-5">
            <h2 className="mb-1 text-sm font-bold text-slate-200">Approval Mode</h2>
            <p className="mb-3 text-[11px] text-slate-500">When enabled, only Lexifi-approved policies can be registered on pools.</p>
            <button onClick={() => writeContract({ address: d.hook, abi: HOOK_ABI, functionName: "setRequireApproval", args: [!requireApproval] })}
              className={`rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                requireApproval ? "bg-lex-green/10 text-lex-green hover:bg-lex-green/20" : "bg-lex-amber/10 text-lex-amber hover:bg-lex-amber/20"
              }`}>
              {requireApproval ? "Switch to Permissionless" : "Enable Approval Required"}
            </button>
          </div>

          {/* Approve Policy */}
          <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
            <h2 className="mb-1 text-sm font-bold text-slate-200">Approve Policy Contract</h2>
            <p className="mb-3 text-[11px] text-slate-500">Whitelist a policy contract after audit.</p>
            <div className="flex gap-2">
              <input value={approveAddr} onChange={(e) => setApproveAddr(e.target.value)} placeholder="Policy contract address"
                className="flex-1 rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30" />
              <button onClick={() => writeContract({ address: d.hook, abi: HOOK_ABI, functionName: "approvePolicy", args: [approveAddr as `0x${string}`] })}
                className="rounded-lg bg-lex-green/10 px-4 py-2.5 text-xs font-bold text-lex-green hover:bg-lex-green/20">Approve</button>
              <button onClick={() => writeContract({ address: d.hook, abi: HOOK_ABI, functionName: "revokePolicy", args: [approveAddr as `0x${string}`] })}
                className="rounded-lg bg-lex-red/10 px-4 py-2.5 text-xs font-bold text-lex-red hover:bg-lex-red/20">Revoke</button>
            </div>
          </div>
        </>
      )}

      {/* Check Policy Approval */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-200">Check Policy Approval</h2>
        <p className="mb-3 text-[11px] text-slate-500">Verify if a policy contract is approved.</p>
        <div className="flex gap-2">
          <input value={checkPolicyAddr} onChange={(e) => setCheckPolicyAddr(e.target.value)} placeholder="Policy contract address"
            className="flex-1 rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30" />
        </div>
        {checkPolicyAddr && isPolicyApproved !== undefined && (
          <div className={`mt-2 rounded-lg px-3 py-2 text-xs font-bold ${isPolicyApproved ? "bg-lex-green/10 text-lex-green" : "bg-lex-red/10 text-lex-red"}`}>
            {isPolicyApproved ? "✓ Approved" : "✗ Not Approved"}
          </div>
        )}
      </div>

      {/* Configure Threshold Policy */}
      <div className="rounded-xl border border-white/[0.04] bg-base-1 p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-200">Configure Threshold Policy</h2>
        <p className="mb-3 text-[11px] text-slate-500">Set compliance thresholds for a specific pool (requires pool admin).</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Pool ID (bytes32)</label>
            <input value={cfgPoolId} onChange={(e) => setCfgPoolId(e.target.value)} placeholder="0x..."
              className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-lex-cyan/30" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">No-KYC Limit (tokens)</label>
              <input type="number" value={cfgNoKyc} onChange={(e) => setCfgNoKyc(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Enhanced Limit (tokens)</label>
              <input type="number" value={cfgEnhanced} onChange={(e) => setCfgEnhanced(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-lex-cyan/30" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">Swap Minimum Tier</label>
              <select value={cfgSwapMin} onChange={(e) => setCfgSwapMin(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 text-xs text-slate-300 outline-none">
                <option value="0">DENIED (open)</option>
                <option value="1">RETAIL (basic KYC)</option>
                <option value="2">ACCREDITED (enhanced)</option>
                <option value="3">INSTITUTIONAL</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-600">LP Minimum Tier</label>
              <select value={cfgLpMin} onChange={(e) => setCfgLpMin(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-base-0 px-3 py-2.5 text-xs text-slate-300 outline-none">
                <option value="0">DENIED (open)</option>
                <option value="1">RETAIL (basic KYC)</option>
                <option value="2">ACCREDITED (enhanced)</option>
                <option value="3">INSTITUTIONAL</option>
              </select>
            </div>
          </div>

          <button onClick={() => {
            if (!cfgPoolId) return;
            writeContract({
              address: d.thresholdPolicy,
              abi: THRESHOLD_POLICY_ABI,
              functionName: "setPoolConfig",
              args: [
                cfgPoolId as `0x${string}`,
                BigInt(Math.floor(parseFloat(cfgNoKyc) * 1e18)),
                BigInt(Math.floor(parseFloat(cfgEnhanced) * 1e18)),
                parseInt(cfgLpMin),
                parseInt(cfgSwapMin),
              ],
            });
          }} disabled={isPending || !cfgPoolId}
            className="w-full rounded-lg bg-gradient-to-r from-lex-cyan to-cyan-600 py-3 text-sm font-bold text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50">
            {isPending ? "Confirming…" : "Configure Thresholds"}
          </button>
        </div>

        {isSuccess && <div className="mt-2 rounded-lg bg-lex-green/10 px-3 py-2 text-xs text-lex-green">Transaction successful!</div>}
        {error && <div className="mt-2 rounded-lg bg-lex-red/10 px-3 py-2 text-xs text-lex-red">{(error as Error).message.slice(0, 120)}</div>}
      </div>
    </div>
  );
}
