import { decodeAbiParameters, decodeFunctionData } from "viem";
import { EventTopics } from "./abis.js";
import { AccessLevel, Operation } from "./types.js";
const SWAP_SELECTOR = "0x41a1df46";
const swapAbi = [
    {
        type: "function",
        name: "swap",
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
            { name: "zeroForOne", type: "bool" },
            { name: "amountSpecified", type: "int256" },
        ],
        outputs: [{ name: "delta", type: "int256" }],
        stateMutability: "payable",
    },
];
function decodePassedEvent(log) {
    try {
        const poolId = log.topics[1] ?? "0x";
        const user = log.topics[2] ? ("0x" + log.topics[2].slice(26)) : "0x0";
        const decoded = decodeAbiParameters([
            { name: "operation", type: "uint8" },
            { name: "accessLevel", type: "uint8" },
            { name: "requiredLevel", type: "uint8" },
            { name: "amount", type: "uint256" },
            { name: "timestamp", type: "uint256" },
        ], log.data);
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
    }
    catch {
        return null;
    }
}
function decodeDeniedTx(tx, hookAddress, fallbackPoolId) {
    try {
        const { args } = decodeFunctionData({
            abi: swapAbi,
            data: tx.raw_input,
        });
        const poolKey = args[0];
        if (poolKey.hooks.toLowerCase() !== hookAddress.toLowerCase())
            return null;
        const amountSpecified = args[2];
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
    }
    catch {
        return null;
    }
}
export async function fetchAuditTrail(options) {
    const { deployment, routerAddresses, fallbackPoolId = "0x" } = options;
    const records = [];
    const logsRes = await fetch(`${deployment.blockscoutApi}/addresses/${deployment.hook}/logs`);
    if (logsRes.ok) {
        const logsData = await logsRes.json();
        for (const log of logsData.items || []) {
            if (log.topics?.[0] === EventTopics.ComplianceCheckPassed) {
                const record = decodePassedEvent(log);
                if (record)
                    records.push(record);
            }
        }
    }
    for (const router of routerAddresses) {
        const txsRes = await fetch(`${deployment.blockscoutApi}/addresses/${router}/transactions`);
        if (!txsRes.ok)
            continue;
        const txsData = await txsRes.json();
        for (const tx of txsData.items || []) {
            if (tx.status === "error" && tx.method === SWAP_SELECTOR) {
                const record = decodeDeniedTx(tx, deployment.hook, fallbackPoolId);
                if (record)
                    records.push(record);
            }
        }
    }
    records.sort((a, b) => b.blockNumber - a.blockNumber);
    return records;
}
//# sourceMappingURL=audit.js.map