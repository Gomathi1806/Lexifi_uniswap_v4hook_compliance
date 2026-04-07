# @lexifi/sdk

**LexiFi** — Compliance-as-a-Service for DeFi on Base.

Integrate KYC/AML-gated Uniswap V4 pools using EAS attestations and zero-knowledge proofs.

## Installation

```bash
npm install @lexifi/sdk
```

## Contracts (Base Mainnet)

| Contract | Address |
|---|---|
| MultiProviderComplianceHook | `0x607c0334cb4d00CdE6fB6dfcf35E4D2a98865BFb` |
| ZKPassProvider | `0x929E5aB25B8E5F37c85dF59792FB24aDe61Cb646` |

- [Hook on BaseScan](https://basescan.org/address/0x607c0334cb4d00CdE6fB6dfcf35E4D2a98865BFb)
- [ZKPassProvider on BaseScan](https://basescan.org/address/0x929E5aB25B8E5F37c85dF59792FB24aDe61Cb646)

## Usage

### Get deployment addresses

```typescript
import { getDeployment } from "@lexifi/sdk";

const base = getDeployment(8453);
console.log(base.contracts.multiProviderComplianceHook);
// 0x607c0334cb4d00CdE6fB6dfcf35E4D2a98865BFb

console.log(base.contracts.zkPassProvider);
// 0x929E5aB25B8E5F37c85dF59792FB24aDe61Cb646
```

### Use ABIs with viem

```typescript
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { MultiProviderComplianceHookABI, getDeployment } from "@lexifi/sdk";

const client = createPublicClient({ chain: base, transport: http() });
const deployment = getDeployment(8453)!;

// Check a user's compliance tier
const tier = await client.readContract({
  address: deployment.contracts.multiProviderComplianceHook,
  abi: MultiProviderComplianceHookABI,
  functionName: "getComplianceTier",
  args: ["0xYourUserAddress"],
});

console.log("Compliance tier:", tier);
// 0 = NONE, 1 = BASIC, 2 = ENHANCED, 3 = INSTITUTIONAL
```

### Check ZK proof verification

```typescript
import { ZKPassProviderABI, getDeployment } from "@lexifi/sdk";

const deployment = getDeployment(8453)!;

const isVerified = await client.readContract({
  address: deployment.contracts.zkPassProvider,
  abi: ZKPassProviderABI,
  functionName: "isVerified",
  args: ["0xYourUserAddress"],
});
```

## Compliance Tiers

| Tier | Value | Description |
|---|---|---|
| `NONE` | 0 | No compliance — pool access denied |
| `BASIC` | 1 | Coinbase Account attestation (KYC lite) |
| `ENHANCED` | 2 | Coinbase Country + ZKPass proof |
| `INSTITUTIONAL` | 3 | Full institutional verification |

## Architecture

- **MultiProviderComplianceHook** — A Uniswap V4 hook that enforces compliance checks via `beforeSwap` and `beforeAddLiquidity`.
- **ZKPassProvider** — Accepts zero-knowledge proofs from zkPass TransGate, storing verified tiers on-chain without exposing raw identity data.
- **EAS Integration** — Trusts attestations from Coinbase (and other issuers) registered on Ethereum Attestation Service.

## License

MIT
