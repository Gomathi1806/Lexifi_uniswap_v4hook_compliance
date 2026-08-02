"use client";

import { useCallback, useEffect, useState } from "react";
import { decodeAbiParameters, decodeFunctionData, formatEther, type Hex } from "viem";
import {
  COMPLIANCE_PASSED_TOPIC,
  AUDIT_RECORD_TOPIC,
  POOL_POLICY_SET_TOPIC,
  PHASE1_PROVER_ABI,
} from "@/config/abi";
import { base, PHASE1, TIERS } from "@/config/contracts";

const OPERATIONS = ["Swap", "Add Liquidity", "Remove Liquidity"] as const;

interface AuditRecord {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  poolId: string;
  user: string;
  operation: number;
  amount: bigint;
  passed: boolean;
  userLevel: number;
  requiredLevel: number;
  reason: string;
  source: "event" | "failed-tx";
}

interface PolicyRecord {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  poolId: string;
  policyName: string;
  policyAddress: string;
  creator: string;
}

type Filter = "all" | "passed" | "denied";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function shortenHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-4)}`;
}

function decodePassedEvent(log: {
  topics: (string | null)[];
  data: string;
  transaction_hash: string;
  block_number: number;
  block_timestamp: string;
}): AuditRecord | null {
  try {
    const poolId = log.topics[1] ?? "0x";
    const user = log.topics[2]
      ? "0x" + log.topics[2].slice(26)
      : "0x0";

    const decoded = decodeAbiParameters(
      [
        { name: "operation", type: "uint8" },
        { name: "accessLevel", type: "uint8" },
        { name: "requiredLevel", type: "uint8" },
        { name: "amount", type: "uint256" },
        { name: "timestamp", type: "uint256" },
      ],
      log.data as Hex,
    );

    return {
      txHash: log.transaction_hash,
      blockNumber: log.block_number,
      timestamp: log.block_timestamp,
      poolId,
      user,
      operation: Number(decoded[0]),
      amount: decoded[3],
      passed: true,
      userLevel: Number(decoded[1]),
      requiredLevel: Number(decoded[2]),
      reason: "Compliance check passed",
      source: "event",
    };
  } catch {
    return null;
  }
}

function decodeDeniedTx(tx: {
  hash: string;
  block_number: number;
  timestamp: string;
  raw_input: string;
  from: { hash: string };
  value: string;
}): AuditRecord | null {
  try {
    const { args } = decodeFunctionData({
      abi: PHASE1_PROVER_ABI,
      data: tx.raw_input as Hex,
    });

    const poolKey = args[0] as { hooks: string };
    if (
      poolKey.hooks.toLowerCase() !==
      base.hook.toLowerCase()
    )
      return null;

    const amountSpecified = args[2] as bigint;
    const absAmount =
      amountSpecified < 0n ? -amountSpecified : amountSpecified;

    return {
      txHash: tx.hash,
      blockNumber: tx.block_number,
      timestamp: tx.timestamp,
      poolId: PHASE1.poolId,
      user: tx.from.hash,
      operation: 0,
      amount: absAmount,
      passed: false,
      userLevel: 0,
      requiredLevel: 1,
      reason: "Swap requires basic verification (reconstructed from revert)",
      source: "failed-tx",
    };
  } catch {
    return null;
  }
}

function decodePolicyEvent(log: {
  topics: (string | null)[];
  data: string;
  transaction_hash: string;
  block_number: number;
  block_timestamp: string;
}): PolicyRecord | null {
  try {
    const poolId = log.topics[1] ?? "0x";
    const policyAddress = log.topics[2]
      ? "0x" + log.topics[2].slice(26)
      : "0x0";
    const creator = log.topics[3]
      ? "0x" + log.topics[3].slice(26)
      : "0x0";

    const decoded = decodeAbiParameters(
      [
        { name: "policyName", type: "string" },
        { name: "policyVersion", type: "uint256" },
      ],
      log.data as Hex,
    );

    return {
      txHash: log.transaction_hash,
      blockNumber: log.block_number,
      timestamp: log.block_timestamp,
      poolId,
      policyName: decoded[0] as string,
      policyAddress,
      creator,
    };
  } catch {
    return null;
  }
}

export default function AuditPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hook = base.hook;

      const [logsRes, txsRes] = await Promise.all([
        fetch(`${base.blockscoutApi}/addresses/${hook}/logs`),
        fetch(
          `${base.blockscoutApi}/addresses/${PHASE1.prover}/transactions`,
        ),
      ]);

      if (!logsRes.ok || !txsRes.ok) throw new Error("Blockscout API request failed");

      const [logsData, txsData] = await Promise.all([
        logsRes.json(),
        txsRes.json(),
      ]);

      const auditRecords: AuditRecord[] = [];
      const policyRecords: PolicyRecord[] = [];

      for (const log of logsData.items || []) {
        const topic0 = log.topics?.[0];
        if (topic0 === COMPLIANCE_PASSED_TOPIC) {
          const record = decodePassedEvent(log);
          if (record) auditRecords.push(record);
        } else if (topic0 === POOL_POLICY_SET_TOPIC) {
          const policy = decodePolicyEvent(log);
          if (policy) policyRecords.push(policy);
        }
      }

      for (const tx of txsData.items || []) {
        if (tx.status === "error" && tx.method === "0x41a1df46") {
          const record = decodeDeniedTx(tx);
          if (record) auditRecords.push(record);
        }
      }

      auditRecords.sort((a, b) => b.blockNumber - a.blockNumber);
      setRecords(auditRecords);
      setPolicies(policyRecords);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch audit data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const filtered =
    filter === "all"
      ? records
      : records.filter((r) =>
          filter === "passed" ? r.passed : !r.passed,
        );
  const passes = records.filter((r) => r.passed).length;
  const denials = records.filter((r) => !r.passed).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-100">
            Compliance Audit Trail
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            On-chain compliance records with denial persistence via failed
            transaction reconstruction.
          </p>
        </div>
        <button
          onClick={fetchAuditData}
          disabled={loading}
          className="rounded-lg border border-white/[0.06] bg-base-1 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-lex-cyan/20 hover:text-lex-cyan disabled:opacity-50"
        >
          {loading ? "Scanning..." : "Refresh"}
        </button>
      </div>

      {/* Phase 2 explanation */}
      <div className="rounded-xl border border-lex-violet/20 bg-lex-violet/[0.04] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lex-violet/15 text-sm text-lex-violet">
            !
          </div>
          <div>
            <div className="text-sm font-bold text-lex-violet">
              Denial-Persistent Audit Trail (Phase 2)
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Solidity reverts roll back <strong>all</strong> state changes,
              including events. When a swap is denied, the{" "}
              <code className="rounded bg-base-0/50 px-1 text-lex-cyan">
                ComplianceCheckFailed
              </code>{" "}
              event is emitted but lost when the transaction reverts. This
              dashboard solves the problem by reconstructing denial records from
              failed transaction data (status=0) on-chain &mdash; the
              calldata and revert reason persist even when events don't.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="Total Checks"
          value={records.length}
          color="text-slate-100"
        />
        <StatCard label="Passed" value={passes} color="text-lex-green" />
        <StatCard label="Denied" value={denials} color="text-lex-red" />
        <StatCard
          label="Pass Rate"
          value={
            records.length > 0
              ? `${Math.round((passes / records.length) * 100)}%`
              : "–"
          }
          color="text-lex-cyan"
        />
      </div>

      {/* Policy registrations */}
      {policies.length > 0 && (
        <div className="rounded-xl border border-white/[0.04] bg-base-1 p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-200">
            Pool Policy Registrations
          </h3>
          <div className="space-y-2">
            {policies.map((p) => (
              <div
                key={p.txHash}
                className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-base-0 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-lex-cyan/10 px-1.5 py-0.5 font-mono text-[10px] text-lex-cyan">
                    POLICY
                  </span>
                  <span className="text-xs text-slate-300">
                    {p.policyName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">
                    Pool {shortenHash(p.poolId)}
                  </span>
                </div>
                <a
                  href={`${base.explorer}/tx/${p.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-lex-cyan hover:underline"
                >
                  {shortenHash(p.txHash)}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-white/[0.04] bg-base-1 p-1">
        {(["all", "passed", "denied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-white/[0.06] text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {f}
            <span className="ml-1.5 font-mono text-[10px] text-slate-600">
              {f === "all"
                ? records.length
                : f === "passed"
                  ? passes
                  : denials}
            </span>
          </button>
        ))}
      </div>

      {/* Audit records table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-lex-cyan/30 border-t-lex-cyan" />
            Scanning on-chain records...
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-lex-red/20 bg-lex-red/[0.04] p-5 text-center">
          <div className="text-sm text-lex-red">{error}</div>
          <button
            onClick={fetchAuditData}
            className="mt-2 text-xs text-slate-400 hover:text-slate-200"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.04] bg-base-1 p-10 text-center">
          <div className="text-sm text-slate-500">
            No {filter !== "all" ? filter : ""} compliance records found.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <AuditRow key={`${r.txHash}-${r.source}`} record={r} />
          ))}
        </div>
      )}

      {/* Data source attribution */}
      <div className="rounded-lg border border-white/[0.04] bg-base-1 px-4 py-3 font-mono text-[10px] text-slate-600">
        Data sources: On-chain event logs (passes) + failed transaction
        reconstruction (denials) via{" "}
        <a
          href="https://base.blockscout.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-lex-cyan hover:underline"
        >
          Blockscout
        </a>{" "}
        API.{" "}
        Hook:{" "}
        <a
          href={`${base.explorer}/address/${base.hook}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lex-cyan hover:underline"
        >
          {shortenAddress(base.hook)}
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-base-1 p-4">
      <div className="text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </div>
      <div className={`mt-1 font-mono text-2xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}

function AuditRow({ record: r }: { record: AuditRecord }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(r.timestamp);
  const timeStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div
      className={`rounded-xl border bg-base-1 transition-colors ${
        r.passed
          ? "border-white/[0.04] hover:border-lex-green/10"
          : "border-lex-red/10 hover:border-lex-red/20"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Status indicator */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
            r.passed
              ? "bg-lex-green/15 text-lex-green"
              : "bg-lex-red/15 text-lex-red"
          }`}
        >
          {r.passed ? "P" : "D"}
        </div>

        {/* Main info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold ${r.passed ? "text-lex-green" : "text-lex-red"}`}
            >
              {r.passed ? "PASSED" : "DENIED"}
            </span>
            <span className="rounded bg-base-0 px-1.5 py-0.5 text-[10px] text-slate-500">
              {OPERATIONS[r.operation] ?? "Unknown"}
            </span>
            {!r.passed && (
              <span className="rounded bg-lex-red/10 px-1.5 py-0.5 text-[10px] font-medium text-lex-red">
                RECONSTRUCTED
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span>{timeStr}</span>
            <span className="text-white/[0.08]">|</span>
            <span className="font-mono">{formatEther(r.amount)} ETH</span>
            <span className="text-white/[0.08]">|</span>
            <span className="font-mono">{shortenAddress(r.user)}</span>
          </div>
        </div>

        {/* Tier badges */}
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              color: TIERS[r.userLevel]?.color,
              backgroundColor: `${TIERS[r.userLevel]?.color}15`,
            }}
          >
            {TIERS[r.userLevel]?.name}
          </span>
          <span className="text-[10px] text-slate-700">/</span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              color: TIERS[r.requiredLevel]?.color,
              backgroundColor: `${TIERS[r.requiredLevel]?.color}15`,
            }}
          >
            {TIERS[r.requiredLevel]?.name} req.
          </span>
        </div>

        {/* TX link */}
        <a
          href={`${base.explorer}/tx/${r.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-lex-cyan hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {shortenHash(r.txHash)}
        </a>

        {/* Expand chevron */}
        <span
          className={`text-[10px] text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          v
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.04] px-4 py-3">
          <div className="grid gap-3 md:grid-cols-2">
            <DetailField label="Transaction" mono>
              <a
                href={`${base.explorer}/tx/${r.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lex-cyan hover:underline"
              >
                {r.txHash}
              </a>
            </DetailField>
            <DetailField label="Block" mono>
              {r.blockNumber.toLocaleString()}
            </DetailField>
            <DetailField label="User" mono>
              <a
                href={`${base.explorer}/address/${r.user}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lex-cyan hover:underline"
              >
                {r.user}
              </a>
            </DetailField>
            <DetailField label="Pool ID" mono>
              {shortenHash(r.poolId)}
            </DetailField>
            <DetailField label="Amount" mono>
              {formatEther(r.amount)} ETH
            </DetailField>
            <DetailField label="Operation">
              {OPERATIONS[r.operation] ?? `Unknown (${r.operation})`}
            </DetailField>
            <DetailField label="User Tier">
              <span style={{ color: TIERS[r.userLevel]?.color }}>
                {TIERS[r.userLevel]?.name} ({r.userLevel})
              </span>
            </DetailField>
            <DetailField label="Required Tier">
              <span style={{ color: TIERS[r.requiredLevel]?.color }}>
                {TIERS[r.requiredLevel]?.name} ({r.requiredLevel})
              </span>
            </DetailField>
            <DetailField label="Data Source" className="md:col-span-2">
              {r.source === "event" ? (
                <span className="text-lex-green">
                  On-chain event log (ComplianceCheckPassed)
                </span>
              ) : (
                <span className="text-lex-red">
                  Reconstructed from failed transaction (status=0, revert
                  data decoded)
                </span>
              )}
            </DetailField>
            <DetailField label="Reason" className="md:col-span-2">
              {r.reason}
            </DetailField>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  children,
  mono,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </div>
      <div
        className={`mt-0.5 break-all text-xs text-slate-300 ${mono ? "font-mono" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
