# Lexifi — DEX Operator Dashboard

Compliance management dashboard for Uniswap V4 pool operators.

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
- **Pools** — Register compliance policies on pools, lookup pool info
- **Checker** — Check any wallet's compliance for a specific pool
- **Settings** — Admin: approve/revoke policies, configure thresholds

## Deployed Contracts (Base Mainnet)

| Contract | Address |
|---|---|
| LexifiHook | `0xb8ab80d89620c29E71563779111b9cb1d4d92880` |
| CoinbaseEASProvider | `0x9Da4bDb53cA77e1788263771fA7459Fec098E1d7` |
| ThresholdPolicy | `0x10741eab10b48d7B4b4f15cCD870255B853b2259` |
| RegionalPolicy | `0x5568f3109B833AeBf107b2ffd665AF9C3931F029` |
| InstitutionalPolicy | `0x312089B3A28Bb8345F7B887d96E1e46Fed4efC30` |
