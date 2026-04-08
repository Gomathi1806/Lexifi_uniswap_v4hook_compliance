# Lexifi

**Pool-Level Compliance Infrastructure for Uniswap V4**

[![Base Mainnet](https://img.shields.io/badge/Base-Mainnet-0052FF)](https://basescan.org/address/0xb8ab80d89620c29E71563779111b9cb1d4d92880)
[![npm](https://img.shields.io/npm/v/@lexifi/sdk)](https://www.npmjs.com/package/@lexifi/sdk)
[![Tests](https://img.shields.io/badge/Tests-80%2B%20Passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

Lexifi enables any DEX, RWA platform, or asset issuer to launch Uniswap V4 pools with **per-pool configurable compliance** — enforced at the smart contract level, not the frontend.

```
Pool A: WETH/USDC  → ThresholdPolicy      → "No KYC under $1k, basic above"
Pool B: RWA/USDC   → InstitutionalPolicy   → "Requires Coinbase + zkPass"  
Pool C: EUR/USDC   → RegionalPolicy        → "EU country attestation required"
Pool D: MEME/WETH  → (no policy)           → Open access, standard V4 pool
```

Same hook contract. Different rules per pool. **Users can always withdraw — exit is never blocked.**

---

## Why Lexifi?

Most "KYC hooks" are single-check, single-provider toy examples. Lexifi is production infrastructure:

| Feature | Other KYC Hooks | Lexifi |
|---------|:-:|:-:|
| Per-pool rules | ❌ | ✅ |
| Multiple providers | ❌ | ✅ (Coinbase + zkPass) |
| Zero-knowledge privacy | ❌ | ✅ |
| Multi-provider N-of-M | ❌ | ✅ |
| On-chain audit trail | ❌ | ✅ |
| Policy templates | ❌ | ✅ (3 templates) |
| Deployed on mainnet | ❌ | ✅ (7 contracts verified) |
| Published SDK | ❌ | ✅ (@lexifi/sdk) |
| Never traps funds | ? | ✅ (CREATE2 enforced) |

---

## Deployed Contracts — Base Mainnet

| Contract | Address | Purpose |
|----------|---------|---------|
| **LexifiHook** | [`0xb8ab80d896...2880`](https://basescan.org/address/0xb8ab80d89620c29E71563779111b9cb1d4d92880) | Core hook — per-pool policy routing |
| **CoinbaseEASProvider** | [`0x9Da4bDb53c...E1d7`](https://basescan.org/address/0x9Da4bDb53cA77e1788263771fA7459Fec098E1d7) | Public identity via Coinbase Verifications |
| **ZKPassProvider** | [`0x929E5aB25B...b646`](https://basescan.org/address/0x929E5aB25B8E5F37c85dF59792FB24aDe61Cb646) | Private identity via zero-knowledge proofs |
| **ThresholdPolicy** | [`0x10741eab10...2259`](https://basescan.org/address/0x10741eab10b48d7B4b4f15cCD870255B853b2259) | Amount-based compliance tiers |
| **RegionalPolicy** | [`0x5568f3109B...F029`](https://basescan.org/address/0x5568f3109B833AeBf107b2ffd665AF9C3931F029) | Geographic compliance (EU MiCA, etc.) |
| **InstitutionalPolicy** | [`0x312089B3A2...fC30`](https://basescan.org/address/0x312089B3A28Bb8345F7B887d96E1e46Fed4efC30) | Multi-provider N-of-M verification |

All contracts verified on BaseScan. Compiler: Solidity 0.8.26, EVM: Cancun.

---

## Live on Mainnet — Proof Transactions

| What | Transaction |
|------|------------|
| Multi-provider pool registration (Coinbase + zkPass) | [`0x98dfd469...`](https://basescan.org/tx/0x98dfd469c2c72f0a9574931a8f2b2b4f40086b4c821396a93c53d55234b33576) |
| Policy approval | [`0x8ecd0200...`](https://basescan.org/tx/0x8ecd0200de4cb5fd53d37044486adcd7061453b2f03249caeb6e9d6b3ece160f) |
| Compliant swap with real WETH/USDC | [`0x0821b530...`](https://basescan.org/tx/0x0821b530f7f973b8d8de5aeeba642985009b24c9f0c57f5ae06f1af58f657d6c) |

---

## Quick Start — Add Compliance to Your Pool in 3 Steps

### Install

```bash
npm install @lexifi/sdk
```

### Step 1: Check if a user is compliant

```typescript
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const HOOK = "0xb8ab80d89620c29E71563779111b9cb1d4d92880";

const client = createPublicClient({ chain: base, transport: http() });

const [allowed, userLevel, requiredLevel, reason] = await client.readContract({
  address: HOOK,
  abi: HOOK_ABI,
  functionName: "checkUserCompliance",
  args: [
    {
      currency0: "0x4200000000000000000000000000000000000006",
      currency1: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      fee: 3000,
      tickSpacing: 60,
      hooks: HOOK,
    },
    userAddress,
    0,        // 0 = swap
    amount,   // trade amount in wei
  ],
});

if (!allowed) {
  console.log("Blocked:", reason);
  // Show "Get Verified" prompt
}
```

### Step 2: Register a compliance policy on your pool

```solidity
// In your deployment script
ILexifiHook(0xb8ab80d89620c29E71563779111b9cb1d4d92880).setPoolPolicy(
    PoolKey({
        currency0: Currency.wrap(WETH),
        currency1: Currency.wrap(USDC),
        fee: 3000,
        tickSpacing: 60,
        hooks: IHooks(0xb8ab80d89620c29E71563779111b9cb1d4d92880)
    }),
    0x10741eab10b48d7B4b4f15cCD870255B853b2259  // ThresholdPolicy
);
```

### Step 3: Configure thresholds

```solidity
thresholdPolicy.setPoolConfig(
    poolId,
    1000e18,    // noKycLimit: no KYC under $1k
    10000e18,   // enhancedLimit: ACCREDITED above $10k
    1,          // lpMinimum: RETAIL
    1           // swapMinimum: RETAIL
);
// Done. Every swap now enforces compliance.
```

---

## Architecture

```
                    ┌──────────────────────────┐
                    │  Uniswap V4 PoolManager  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │       LexifiHook          │
                    │                           │
                    │  beforeSwap()        ── Enforce compliance
                    │  beforeAddLiquidity() ── Enforce compliance  
                    │  beforeRemoveLiq()   ── ALWAYS ALLOW (never block exit)
                    │                           │
                    │  poolPolicy[poolId]  ── Per-pool routing
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
     ThresholdPolicy     RegionalPolicy     InstitutionalPolicy
     (amount-based)      (geographic)       (multi-provider N-of-M)
              │                  │                   │
              └──────────────────┼──────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                                      │
      CoinbaseEASProvider                     ZKPassProvider
      (public attestation)                    (private ZK proof)
              │                                      │
         EAS on Base                          Zero-knowledge proofs
```

---

## Compliance Tiers

| Tier | Name | Coinbase EAS Requirement | Use Case |
|:---:|------|--------------------------|----------|
| 0 | **DENIED** | None | Blocked from compliant pools |
| 1 | **RETAIL** | Verified Account | Retail trading above thresholds |
| 2 | **ACCREDITED** | Account + Country | Regulated markets, large trades |
| 3 | **INSTITUTIONAL** | Business Verified | RWA, security tokens |

---

## Policy Templates

### ThresholdPolicy — Amount-Based
Graduated compliance. Small trades are frictionless, large trades require verification.

| User Tier | Trade < $1k | $1k - $10k | > $10k | Add Liquidity |
|-----------|:-:|:-:|:-:|:-:|
| DENIED (0) | ✅ | ❌ | ❌ | ❌ |
| RETAIL (1) | ✅ | ✅ | ❌ | ✅ |
| ACCREDITED (2) | ✅ | ✅ | ✅ | ✅ |

### RegionalPolicy — Geographic
Requires country attestation for EU MiCA, US securities, or sanctioned jurisdiction screening.

### InstitutionalPolicy — Multi-Provider N-of-M
Maximum security. Multiple providers must agree. Currently configured with Coinbase + zkPass (1-of-2).

---

## Verification Providers

| Provider | Privacy | Status | Method |
|----------|---------|:---:|--------|
| **CoinbaseEASProvider** | Public | ✅ Live | Reads Coinbase Verifications via EAS on Base |
| **ZKPassProvider** | Private (ZK) | ✅ Live | Zero-knowledge proofs — user data never on-chain |
| Worldcoin World ID | Private | 🔜 Planned | Biometric proof-of-personhood |
| Polygon ID | Private (ZK) | 🔜 Planned | Verifiable credentials |

---

## Key Design Principles

1. **Exit never blocked** — `beforeRemoveLiquidity` permission bit is `false` in the CREATE2 address. Users can always withdraw. Immutable.

2. **Zero custom accounting** — Returns `ZERO_DELTA` and fee override `0`. Never modifies swap amounts or takes fees. Pure access control.

3. **Fail-safe to DENIED** — If any provider call fails (EAS down, RPC error), users are denied — never falsely approved.

4. **Per-pool configurability** — Each pool chooses its own policy. A retail MEME pool and an institutional RWA pool on the same DEX have different rules.

5. **Provider agnostic** — `IVerificationProvider` interface supports any identity system. Add new providers without changing the hook or policies.

---

## Project Structure

```
├── src/                          # Smart contracts
│   ├── LexifiHook.sol            # Core hook (IHooks implementation)
│   ├── interfaces/
│   │   ├── ILexifiPolicy.sol     # Policy interface
│   │   └── IVerificationProvider.sol
│   ├── libraries/
│   │   └── LexifiEvents.sol      # Audit trail events
│   └── providers/
│       ├── CoinbaseEASProvider.sol
│       └── ZKPassProvider.sol
├── test/                         # 80+ Foundry tests
│   ├── MultiProviderComplianceHook.t.sol
│   ├── ZKPassProvider.t.sol
│   └── ForkTest.t.sol
├── script/                       # Deployment scripts
│   ├── DeployHook.s.sol
│   ├── DeployZKPass.s.sol
│   └── RegisterMultiProviderPool.s.sol
├── lexifi-sdk/                   # TypeScript SDK (@lexifi/sdk)
├── docs/                         # Documentation
└── lib/                          # Dependencies (forge)
```

---

## Development

```bash
# Clone
git clone https://github.com/Gomathi1806/Lexifi_uniswap_v4hook_compliance.git
cd Lexifi_uniswap_v4hook_compliance

# Install Foundry dependencies
forge install

# Build contracts
forge build

# Run tests (skip fork tests that need live RPC)
forge test --no-match-contract ForkTest

# Run all tests
forge test
```

---

## Who Is This For?

**DEX Operators** — Launch "Verified Only" pools alongside permissionless pools. Serve institutional liquidity without rebuilding your protocol.

**RWA Platforms** — Tokenized bonds, real estate, and securities need compliant secondary markets. Lexifi provides the compliance layer on Uniswap V4.

**Asset Issuers** — Issue tokens that can only be traded by verified investors. Configure per-pool: accredited only, institutional only, regional restrictions.

---

## Links

| Resource | URL |
|----------|-----|
| Dashboard | [lexifiio.vercel.app](https://lexifiio.vercel.app) |
| npm SDK | [@lexifi/sdk](https://www.npmjs.com/package/@lexifi/sdk) |
| Hook Contract | [BaseScan](https://basescan.org/address/0xb8ab80d89620c29E71563779111b9cb1d4d92880) |
| ZKPass Provider | [BaseScan](https://basescan.org/address/0x929E5aB25B8E5F37c85dF59792FB24aDe61Cb646) |
| Demo Pool TX | [BaseScan](https://basescan.org/tx/0x98dfd469c2c72f0a9574931a8f2b2b4f40086b4c821396a93c53d55234b33576) |
| Proof Swap TX | [BaseScan](https://basescan.org/tx/0x0821b530f7f973b8d8de5aeeba642985009b24c9f0c57f5ae06f1af58f657d6c) |

---

## License

MIT

---

Built by a Uniswap V4 Hook Incubator Graduate (Atrium Academy)
