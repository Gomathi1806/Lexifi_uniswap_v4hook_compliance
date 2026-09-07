# Lexifi

**Pool-Level Compliance Infrastructure for Uniswap v4**

[![Base Mainnet](https://img.shields.io/badge/Base-Mainnet-0052FF)](https://basescan.org/address/0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880)
[![Tests](https://img.shields.io/badge/Tests-124%20Passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

Lexifi enables any DEX, RWA platform, or asset issuer to launch Uniswap v4 pools with
**per-pool configurable compliance** — enforced at the smart contract level, not the frontend.

```
Pool A: WETH/USDC  → ThresholdPolicy      → "No KYC under $1k, basic above"
Pool B: RWA/USDC   → InstitutionalPolicy  → "Requires Coinbase + operator sign-off"
Pool C: EUR/USDC   → RegionalPolicy       → "EU country attestation required"
Pool D: MEME/WETH  → (no policy)          → Open access, standard v4 pool
```

Same hook contract. Different rules per pool. **Users can always withdraw — exit is never blocked.**

---

## Two integration paths

Lexifi works through the hook directly, or as an allowlist checker behind Uniswap's
Permissioned Pools. They are complementary, and the difference matters:

| | `LexifiHook` (direct) | `LexifiAllowlistChecker` (Permissioned Pools) |
|---|---|---|
| Sees pool id | ✅ | ❌ — resolved via a `token → poolId` binding |
| Sees operation (swap vs LP) | ✅ | ❌ — expressed as permission flags |
| Sees trade size | ✅ | ❌ — evaluated at a fixed `evaluationAmount` |
| Amount-based gating | ✅ | ❌ not expressible |
| On-chain audit trail | ✅ events | ❌ `view` function, emits nothing |
| Works with Uniswap's `PermissionsAdapter` | ❌ | ✅ |

Pools that need size-dependent rules or the audit trail should use the hook directly.

---

## Deployed Contracts — Base Mainnet (chainId 8453)

Canonical list: `lexifi-sdk/src/addresses.ts`. All verified on BaseScan and confirmed
live on-chain 2026-09-07.

| Contract | Address | Purpose |
|----------|---------|---------|
| **LexifiHook** | [`0xfE92DE69d2…2880`](https://basescan.org/address/0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880) | Core hook — per-pool policy routing |
| **CoinbaseEASProvider** | [`0xb5DEC225A1…ca27`](https://basescan.org/address/0xb5DEC225A104A276671A765aba3890EC88A2ca27) | Identity via Coinbase Verifications (EAS on Base) |
| **SelfAttestationProvider** | [`0x344E491736…0483`](https://basescan.org/address/0x344E4917360F5b44680D097c5E4904Ac62c00483) | Operator-run KYC — attest / batch attest / revoke, with expiry |
| **ThresholdPolicy** | [`0x75f4913F53…4199`](https://basescan.org/address/0x75f4913F53B694fDda95E49456D163Ca7AEf4199) | Amount-based compliance tiers |
| **RegionalPolicy** | [`0xA99A89Cd5A…A44F`](https://basescan.org/address/0xA99A89Cd5A61e975fB11047D3ed455fCCad9A44F) | Geographic compliance (EU MiCA, etc.) |
| **InstitutionalPolicy** | [`0xaD09fc6308…b5fb`](https://basescan.org/address/0xaD09fc63080736b1dFC4048F3589C481225db5fb) | Multi-provider N-of-M verification |
| **LexifiComplianceAdapter** | [`0xe59fB4347C…68eE`](https://basescan.org/address/0xe59fB4347Ca17aA94BBd62eBb9921877b06B68eE) | Single-staticcall compliance entry point for third-party hooks |
| **LexifiAllowlistChecker** | [`0x3882cD5416…94bc`](https://basescan.org/address/0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc) | `IAllowlistChecker` for Uniswap v4 Permissioned Pools |

Compiler: Solidity 0.8.26, EVM Cancun. Owner of every contract: Safe
[`0x17ae269e27524E82F29ca76Cb39A151A90a34B7e`](https://app.safe.global/base:0x17ae269e27524E82F29ca76Cb39A151A90a34B7e)
(1-of-1 on Base). Owner-only calls go through Safe TX Builder.

> **`LexifiAllowlistChecker` currently binds no tokens and therefore denies every address.**
> That is its intended resting state — it activates only when the Safe calls `bindToken`.

### Deprecated — do not use

**v1** (owner key `0x22bc…a621` compromised; its `CoinbaseEASProvider` had EAS
`recipient`/`attester` swapped, so every verification silently returned tier 0):
hook `0xb8ab…2880`, provider `0x9Da4…E1d7`, threshold `0x1074…2259`, regional `0x5568…F029`,
institutional `0x3120…fC30`, zkPass `0x929E…b646`.

**v2** (owner was a Coinbase Smart Wallet BaseScan cannot drive — orphaned on-chain):
hook `0x67a9…2880`, provider `0xF701…A7ea`, threshold `0x0b37…b74b`, regional `0xcF06…d6e2`,
institutional `0xbe8a…88d5`.

---

## Live on Mainnet — Proof Transactions

Phase 1 proof-of-loop, 2026-07-27. Pool: ETH/TestToken, ThresholdPolicy with
`noKycLimit = 0.0001 ETH`.

| What | Transaction |
|------|------------|
| Initialize pool | [`0xf8d7fd20…9614`](https://basescan.org/tx/0xf8d7fd20916ec9f80720059102ac9486e6e4eb1cab668d234706f5b5325a9614) |
| Register ThresholdPolicy on the pool | [`0xcf3d2f17…68e1`](https://basescan.org/tx/0xcf3d2f17fe078fb679a564ea8ad55fe9f6c779c7839e2ee9a2a09acec8e168e1) |
| **Passing swap** — below threshold | [`0x593f00ab…fbda`](https://basescan.org/tx/0x593f00ab2d229683caaecc1adf3fd659e2249e6c1a6b16681a4b93d09cb3fbda) |
| **Denied swap** — above threshold, reverts | [`0x7eba76ae…4c22`](https://basescan.org/tx/0x7eba76aedf5e540fdc3d31419537ebedd9c5cd951a36e59c6364758a85f44c22) |

Phase 5 deploys, 2026-09-04:
[adapter `0x0c7e59f1…a8c3`](https://basescan.org/tx/0x0c7e59f1b7b1dde600ea8c92221b75e2a3051fabb679df36dec1997d62ada8c3) ·
[checker `0xd9edfd7b…6250`](https://basescan.org/tx/0xd9edfd7b3bcdac45f23d2df88ff6698ee794928546b072bbf6910e9575c56250)

---

## SDK

The repo builds `@lexifi/sdk` **0.2.0** (ABIs, addresses, types, `fetchAuditTrail()`;
ESM + TypeScript, peer dep on viem).

> ⚠️ **Do not `npm install @lexifi/sdk` yet.** The version published on npm is **1.0.0
> from 2026-04-07** — a v1-era build that points at the deprecated hook
> `0x607c…5BFb` and zkPass provider `0x929E…b646`. It is stale and its version number is
> *higher* than the current source, so `npm publish` would be rejected until the local
> version is bumped past 1.0.0. Until that is resolved, consume the SDK from source.

---

## Quick Start — Add Compliance to Your Pool

### Step 1: Check if a user is compliant

```typescript
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { getDeployment, LexifiHookAbi } from "@lexifi/sdk";

const { hook } = getDeployment(8453);
const client = createPublicClient({ chain: base, transport: http() });

const [allowed, userLevel, requiredLevel, reason] = await client.readContract({
  address: hook,
  abi: LexifiHookAbi,
  functionName: "checkUserCompliance",
  args: [
    {
      currency0: "0x4200000000000000000000000000000000000006", // WETH
      currency1: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
      fee: 3000,
      tickSpacing: 60,
      hooks: hook,
    },
    userAddress,
    0,        // 0 = swap, 1 = addLiquidity
    amount,   // trade amount in wei
  ],
});

if (!allowed) {
  console.log("Blocked:", reason); // show a "Get Verified" prompt
}
```

### Step 2: Register a compliance policy on your pool

```solidity
ILexifiHook(0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880).setPoolPolicy(
    PoolKey({
        currency0: Currency.wrap(WETH),
        currency1: Currency.wrap(USDC),
        fee: 3000,
        tickSpacing: 60,
        hooks: IHooks(0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880)
    }),
    0x75f4913F53B694fDda95E49456D163Ca7AEf4199  // ThresholdPolicy
);
```

### Step 3: Configure thresholds

```solidity
thresholdPolicy.setPoolConfig(
    poolId,
    1000e18,    // noKycLimit: no KYC under $1k
    10000e18,   // enhancedLimit: ACCREDITED required above $10k
    1,          // lpMinimum: RETAIL
    1           // swapMinimum: RETAIL
);
```

---

## Architecture

```
                    ┌──────────────────────────┐
                    │  Uniswap v4 PoolManager  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │        LexifiHook          │
                    │                            │
                    │  beforeSwap()         ── Enforce compliance
                    │  beforeAddLiquidity() ── Enforce compliance
                    │  beforeRemoveLiq()    ── ALWAYS ALLOW (never block exit)
                    │                            │
                    │  poolPolicy[poolId]   ── Per-pool routing
                    └────────────┬──────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
     ThresholdPolicy      RegionalPolicy      InstitutionalPolicy
     (amount-based)       (geographic)        (multi-provider N-of-M)
              └──────────────────┼──────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
      CoinbaseEASProvider                  SelfAttestationProvider
      (Coinbase Verifications)             (operator's own KYC)
              │                                     │
         EAS on Base                        On-chain attestations

  Permissioned Pools path:
  Uniswap PermissionsAdapter → LexifiAllowlistChecker → LexifiComplianceAdapter → LexifiHook
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
Swaps below `noKycLimit` bypass the tier check entirely.

| User Tier | Swap < $1k | $1k – $10k | > $10k | Add Liquidity |
|-----------|:-:|:-:|:-:|:-:|
| DENIED (0) | ✅ | ❌ | ❌ | ❌ |
| RETAIL (1) | ✅ | ✅ | ❌ | ✅ |
| ACCREDITED (2) | ✅ | ✅ | ✅ | ✅ |

Note: the liquidity check gates on tier alone — it never looks at amount. See
Known Limitations.

### RegionalPolicy — Geographic
Country attestation for EU MiCA, US securities, or sanctioned-jurisdiction screening.

### InstitutionalPolicy — Multi-Provider N-of-M
Multiple independent providers must clear the user — e.g. Coinbase EAS **and** the
operator's own KYC sign-off, as two independent trust anchors.

---

## Verification Providers

| Provider | Status | Method |
|----------|:---:|--------|
| **CoinbaseEASProvider** | ✅ Live | Reads Coinbase Verifications via EAS on Base |
| **SelfAttestationProvider** | ✅ Live | Operator verifies off-chain, stamps tiers on-chain (batch + expiry + revoke) |
| Worldcoin World ID | 🔜 Planned | Biometric proof-of-personhood |
| Polygon ID | 🔜 Planned | Verifiable credentials (ZK) |

Any identity system implementing `IVerificationProvider` can be added without changing
the hook or the policies.

---

## Key Design Principles

1. **Exit never blocked** — the `beforeRemoveLiquidity` permission bit is `false` in the
   CREATE2-mined address. Users can always withdraw. Immutable.
2. **Zero custom accounting** — returns `ZERO_DELTA` and fee override `0`. Never modifies
   swap amounts or takes fees. Pure access control.
3. **Fail-safe to DENIED** — if a provider call fails (EAS down, RPC error), users are
   denied, never falsely approved.
4. **Per-pool configurability** — a retail MEME pool and an institutional RWA pool on the
   same DEX have different rules.
5. **Provider agnostic** — `IVerificationProvider` supports any identity system.

---

## Known Limitations

- **Base only.** Coinbase Verifications attestations exist on Base. On any other chain
  `CoinbaseEASProvider` resolves every address to tier 0, and because the stack fails
  closed, that yields a pool denying everyone.
- **Denials leave no event.** A revert rolls back the `ComplianceCheckFailed` and
  `AuditRecord` events emitted before it. The dashboard's `/audit` page reconstructs
  denials from reverted-transaction calldata via Blockscout and marks them
  `RECONSTRUCTED`.
- **The Permissioned Pools path cannot express size-dependent rules** and emits no audit
  events — `checkAllowlist` is `view` and receives no pool id, operation, or amount.
- **Open policy audit findings (2026-09-04)** affecting deployed contracts — see
  `lexifi-v2-secure/DEPLOYMENT-RUNBOOK.md` and the PoCs in `test/PolicyAsymmetryAudit.t.sol`:
  1. `RegionalPolicy` swap/LP asymmetry when an admin sets `minLp < minSwap`.
  2. `RegionalPolicy.requireCountryAttestation` returns the user's real level instead of
     `DENIED`, so the flag enforces nothing.
  3. `InstitutionalPolicy`'s N-of-M quorum does not gate — one passing provider clears a
     user on a 2-of-3 pool.

  The policies are immutable, so fixing these means redeploying and re-pointing pools.

---

## Development

```bash
forge install     # Foundry dependencies
forge build
forge test        # 124 tests
```

---

## Who Is This For?

**DEX Operators** — launch "Verified Only" pools alongside permissionless ones.
**RWA Platforms** — compliant secondary markets for tokenized bonds, real estate, securities.
**Asset Issuers** — tokens tradable only by verified investors, configured per pool.

---

## Links

| Resource | URL |
|----------|-----|
| Dashboard | [lexifiio.vercel.app](https://lexifiio.vercel.app) |
| Hook Contract | [BaseScan](https://basescan.org/address/0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880) |
| Allowlist Checker | [BaseScan](https://basescan.org/address/0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc) |
| Owner Safe | [Safe](https://app.safe.global/base:0x17ae269e27524E82F29ca76Cb39A151A90a34B7e) |
| Proof swap (passing) | [BaseScan](https://basescan.org/tx/0x593f00ab2d229683caaecc1adf3fd659e2249e6c1a6b16681a4b93d09cb3fbda) |
| Proof swap (denied) | [BaseScan](https://basescan.org/tx/0x7eba76aedf5e540fdc3d31419537ebedd9c5cd951a36e59c6364758a85f44c22) |

---

## License

MIT

Built by a Uniswap V4 Hook Incubator Graduate (Atrium Academy)
