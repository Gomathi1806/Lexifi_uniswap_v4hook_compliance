# Lexifi — DEX Operator Dashboard

Compliance management dashboard for Uniswap v4 pool operators.

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your WalletConnect project ID
npm run dev
```

Open http://localhost:3000

## Pages

- **Overview** — Stats, deployed contracts, tier reference
- **Pools** — Register compliance policies on pools, configure policy parameters, lookup pool info
- **Checker** — Check any wallet's compliance for a specific pool, across all providers
- **Audit** — On-chain audit trail: passes from event logs, denials reconstructed from
  reverted transactions via Blockscout. No wallet connection required.
- **Settings** — Admin: approve/revoke policies, configure thresholds

## Deployed Contracts (Base Mainnet, chainId 8453)

Addresses are imported from `@lexifi/sdk` (`lexifi-sdk/src/addresses.ts`) — that file is the
single source of truth. This table is a copy for readers; verified against Base mainnet
on 2026-09-07.

| Contract | Address |
|---|---|
| LexifiHook | [`0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880`](https://basescan.org/address/0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880) |
| CoinbaseEASProvider | [`0xb5DEC225A104A276671A765aba3890EC88A2ca27`](https://basescan.org/address/0xb5DEC225A104A276671A765aba3890EC88A2ca27) |
| SelfAttestationProvider | [`0x344E4917360F5b44680D097c5E4904Ac62c00483`](https://basescan.org/address/0x344E4917360F5b44680D097c5E4904Ac62c00483) |
| ThresholdPolicy | [`0x75f4913F53B694fDda95E49456D163Ca7AEf4199`](https://basescan.org/address/0x75f4913F53B694fDda95E49456D163Ca7AEf4199) |
| RegionalPolicy | [`0xA99A89Cd5A61e975fB11047D3ed455fCCad9A44F`](https://basescan.org/address/0xA99A89Cd5A61e975fB11047D3ed455fCCad9A44F) |
| InstitutionalPolicy | [`0xaD09fc63080736b1dFC4048F3589C481225db5fb`](https://basescan.org/address/0xaD09fc63080736b1dFC4048F3589C481225db5fb) |
| LexifiComplianceAdapter | [`0xe59fB4347Ca17aA94BBd62eBb9921877b06B68eE`](https://basescan.org/address/0xe59fB4347Ca17aA94BBd62eBb9921877b06B68eE) |
| LexifiAllowlistChecker | [`0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc`](https://basescan.org/address/0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc) |

All verified on BaseScan. Owner of every contract: Safe
[`0x17ae269e27524E82F29ca76Cb39A151A90a34B7e`](https://app.safe.global/base:0x17ae269e27524E82F29ca76Cb39A151A90a34B7e)
(1-of-1 on Base). Owner-only calls go through Safe TX Builder.

### Deprecated — do not use

| Generation | Addresses | Why |
|---|---|---|
| v1 | hook `0xb8ab…2880`, provider `0x9Da4…E1d7`, threshold `0x1074…2259`, regional `0x5568…F029`, institutional `0x3120…fC30`, zkPass `0x929E…b646` | Owner key `0x22bc…a621` compromised. The v1 `CoinbaseEASProvider` also had EAS `recipient`/`attester` swapped, so every verification silently returned tier 0. |
| v2 | hook `0x67a9…2880`, provider `0xF701…A7ea`, threshold `0x0b37…b74b`, regional `0xcF06…d6e2`, institutional `0xbe8a…88d5` | Owner was a Coinbase Smart Wallet that BaseScan's Write Contract tab cannot drive (`maxPriorityFeePerGas cannot be null`). Orphaned on-chain. |

## Base Sepolia

Partial and older than mainnet — `regionalPolicy`, `selfAttestationProvider`,
`complianceAdapter` and `allowlistChecker` are `NOT_DEPLOYED`. See
`lexifi-sdk/src/addresses.ts`.
