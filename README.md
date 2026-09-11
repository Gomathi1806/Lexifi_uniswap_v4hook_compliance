# Lexifi — Operator Dashboard

Next.js dashboard for Uniswap v4 pool operators using Lexifi. Live at
[lexifiio.vercel.app](https://lexifiio.vercel.app).

This repository is the web app only. The contracts live in
[lexifi-contracts](https://github.com/Gomathi1806/lexifi-contracts).

## Run locally

```bash
npm ci
cp .env.example .env.local   # add a WalletConnect project ID
npm run dev                  # http://localhost:3000
```

`npm run build` produces the production build. Without a WalletConnect project ID the app
still builds and reads chain data; only wallet connection needs the ID.

## Pages

- **Overview**: stats, deployed contracts, tier reference
- **Pools**: register a policy on a pool, write its configuration, look up pool info
- **Checker**: check any wallet's compliance for a pool, across every provider
- **Audit**: the on-chain audit trail. Passes come from event logs; denials are reconstructed
  from reverted transactions through Blockscout. No wallet needed.
- **Settings**: owner actions, such as approving or revoking policies

## Where addresses and ABIs come from

Everything is imported from `@lexifi/sdk`. The SDK is vendored as a copy in `lexifi-sdk/`,
compiled output included, and installed as `file:./lexifi-sdk`. Vercel builds from that copy
(a path outside the project does not resolve there), so updating the SDK means copying a new
build into `lexifi-sdk/` and committing it, `dist/` included.

Current copy: `@lexifi/sdk` 2.0.0.

## Deployed contracts (Base mainnet, chainId 8453)

A copy for readers. The source of truth is `lexifi-sdk/src/addresses.ts`. Confirmed on-chain
2026-09-11.

| Contract | Address |
|---|---|
| LexifiHook | [`0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880`](https://basescan.org/address/0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880) |
| LexifiPolicyConfig | [`0x9E005c201AEe5Db3c67b3658Cc18723dfDEe42E1`](https://basescan.org/address/0x9E005c201AEe5Db3c67b3658Cc18723dfDEe42E1) |
| RegionalPolicyV3 | [`0x5309C741094e8901f9D2Ad1f31DC560006542a82`](https://basescan.org/address/0x5309C741094e8901f9D2Ad1f31DC560006542a82) |
| InstitutionalPolicyV3 | [`0xdA93C63212CF41dB3680319B3839f254aC319177`](https://basescan.org/address/0xdA93C63212CF41dB3680319B3839f254aC319177) |
| ThresholdPolicy | [`0x75f4913F53B694fDda95E49456D163Ca7AEf4199`](https://basescan.org/address/0x75f4913F53B694fDda95E49456D163Ca7AEf4199) |
| CoinbaseEASProvider | [`0xb5DEC225A104A276671A765aba3890EC88A2ca27`](https://basescan.org/address/0xb5DEC225A104A276671A765aba3890EC88A2ca27) |
| SelfAttestationProvider | [`0x344E4917360F5b44680D097c5E4904Ac62c00483`](https://basescan.org/address/0x344E4917360F5b44680D097c5E4904Ac62c00483) |
| LexifiComplianceAdapter | [`0xE59FB4347CA17Aa94BBD62eBB9921877B06b68eE`](https://basescan.org/address/0xE59FB4347CA17Aa94BBD62eBB9921877B06b68eE) |
| LexifiAllowlistChecker | [`0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc`](https://basescan.org/address/0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc) |

Owner, where a contract has one: Safe
[`0x17ae269e27524E82F29ca76Cb39A151A90a34B7e`](https://app.safe.global/base:0x17ae269e27524E82F29ca76Cb39A151A90a34B7e).
Retired addresses, and why each was retired, are listed in the
[contracts README](https://github.com/Gomathi1806/lexifi-contracts#retired--do-not-use).

Base Sepolia is partial and older than mainnet; see `lexifi-sdk/src/addresses.ts`.

## Deploying

Git auto-deploy is off (`vercel.json`), so pushing does not update the site. Deploy with the
Vercel CLI from this directory: `vercel --prod`.

## Repository layout

| Path | Contents |
|---|---|
| `src/app/` | The five pages |
| `src/components/` | App shell, navigation, wallet providers |
| `src/config/` | wagmi config and re-exports from the SDK |
| `lexifi-sdk/` | Vendored `@lexifi/sdk` build |
| `archive/v1-prototype/` | The original v1 Solidity prototype, retired and kept for history. Read its README before opening anything in it. |
