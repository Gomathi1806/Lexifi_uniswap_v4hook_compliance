import { decodeAbiParameters, decodeFunctionData, type Hex } from "viem";
import { EventTopics } from "./abis.js";
import type { LexifiDeployment } from "./addresses.js";
import { AccessLevel, Operation, type AuditRecord } from "./types.js";

interface BlockscoutLog {
  topics: (string | null)[];
  data: string;
  transaction_hash: string;
  block_number: number;
  block_timestamp: string;
}

interface BlockscoutTx {
  hash: string;
  block_number: number;
  timestamp: string;
  raw_input: string;
  from: { hash: string };
  value: string;
  status: string;
  method: string;
}

const SWAP_SELECTOR = "0x41a1df46";

const swapAbi = [
  {
    type: "function" as const,
    name: "swap" as const,
    inputs: [
      {
        name: "key",
        type: "tuple" as const,
        components: [
          { name: "currency0", type: "address" as const },
          { name: "currency1", type: "address" as const },
          { name: "fee", type: "uint24" as const },
          { name: "tickSpacing", type: "int24" as const },
          { name: "hooks", type: "address" as const },
        ],
      },
      { name: "zeroForOne", type: "bool" as const },
      { name: "amountSpecified", type: "int256" as const },
    ],
    outputs: [{ name: "delta", type: "int256" as const }],
    stateMutability: "payable" as const,
  },
] as const;

function decodePassedEvent(log: BlockscoutLog): AuditRecord | null {
  try {
    const poolId = log.topics[1] ?? "0x";
    const user = log.topics[2] ? ("0x" + log.topics[2].slice(26)) : "0x0";

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
      operation: Number(decoded[0]) as Operation,
      amount: decoded[3],
      passed: true,
      userLevel: Number(decoded[1]) as AccessLevel,
      requiredLevel: Number(decoded[2]) as AccessLevel,
      reason: "Compliance check passed",
      source: "event",
    };
  } catch {
    return null;
  }
}

function decodeDeniedTx(
  tx: BlockscoutTx,
  hookAddress: string,
  fallbackPoolId: string,
): AuditRecord | null {
  try {
    const { args } = decodeFunctionData({
      abi: swapAbi,
      data: tx.raw_input as Hex,
    });

    const poolKey = args[0] as { hooks: string };
    if (poolKey.hooks.toLowerCase() !== hookAddress.toLowerCase()) return null;

    const amountSpecified = args[2] as bigint;
    const absAmount = amountSpecified < 0n ? -amountSpecified : amountSpecified;

    return {
      txHash: tx.hash,
      blockNumber: tx.block_number,
      timestamp: tx.timestamp,
      poolId: fallbackPoolId,
      user: tx.from.hash,
      operation: Operation.SWAP,
      amount: absAmount,
      passed: false,
      userLevel: AccessLevel.DENIED,
      requiredLevel: AccessLevel.RETAIL,
      reason: "Swap requires basic verification (reconstructed from revert)",
      source: "failed-tx",
    };
  } catch {
    return null;
  }
}

export interface FetchAuditOptions {
  deployment: LexifiDeployment;
  routerAddresses: `0x${string}`[];
  fallbackPoolId?: string;
}

export async function fetchAuditTrail(
  options: FetchAuditOptions,
): Promise<AuditRecord[]> {
  const { deployment, routerAddresses, fallbackPoolId = "0x" } = options;
  const records: AuditRecord[] = [];

  const logsRes = await fetch(
    `${deployment.blockscoutApi}/addresses/${deployment.hook}/logs`,
  );
  if (logsRes.ok) {
    const logsData = await logsRes.json();
    for (const log of logsData.items || []) {
      if (log.topics?.[0] === EventTopics.ComplianceCheckPassed) {
        const record = decodePassedEvent(log);
        if (record) records.push(record);
      }
    }
  }

  for (const router of routerAddresses) {
    const txsRes = await fetch(
      `${deployment.blockscoutApi}/addresses/${router}/transactions`,
    );
    if (!txsRes.ok) continue;
    const txsData = await txsRes.json();
    for (const tx of txsData.items || []) {
      if (tx.status === "error" && tx.method === SWAP_SELECTOR) {
        const record = decodeDeniedTx(tx, deployment.hook, fallbackPoolId);
        if (record) records.push(record);
      }
    }
  }

  records.sort((a, b) => b.blockNumber - a.blockNumber);
  return records;
}
