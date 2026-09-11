# @lexifi/sdk

TypeScript SDK for [Lexifi](https://lexifiio.vercel.app), pool-level compliance for Uniswap v4.
It ships the deployed contract addresses, ABIs, types, encoders for policy configuration and a
fetcher for the on-chain audit trail. ESM only, with `viem` as a peer dependency.

```bash
npm install @lexifi/sdk viem
```

> **Use 2.0.0 or later.** `1.0.0` (April 2026) was built from the retired v1 codebase and
> points at contracts that are compromised or superseded. It is deprecated.

## Check whether a wallet may trade in a pool

`checkUserCompliance` runs the same check the hook enforces in `beforeSwap`, without sending
a transaction.

```typescript
import { createPublicClient, http, parseUnits } from "viem";
import { base } from "viem/chains";
import { getDeployment, LexifiHookAbi, Operation } from "@lexifi/sdk";

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
    trader,
    Operation.SWAP,
    parseUnits("5000", 18),
  ],
});

if (!allowed) showVerificationPrompt(reason);
```

If you already have the pool id, `LexifiComplianceAdapterAbi.checkCompliance(poolId, user,
operation, amount)` answers the same question in one call.

## Permissioned Pools: why was this wallet denied?

Uniswap's `PermissionsAdapter` only sees opaque permission bits. `previewPermissions` returns
the reason behind them, which is what a user needs to see.

```typescript
import { LexifiAllowlistCheckerAbi } from "@lexifi/sdk";

const [swapAllowed, liquidityAllowed, userTier, requiredSwapTier, reason] =
  await client.readContract({
    address: getDeployment(8453).allowlistChecker,
    abi: LexifiAllowlistCheckerAbi,
    functionName: "previewPermissions",
    args: [account, permissionedToken],
  });
```

## Write a pool's policy configuration

Regional and Institutional policies read their configuration from `LexifiPolicyConfig`. Encode
it client-side and write it in one transaction. The caller must be the pool's registry admin
(the first address to write config for that pool).

```typescript
import { ConfigFamily, LexifiPolicyConfigAbi, encodeRegionalConfig, AccessLevel } from "@lexifi/sdk";

const data = encodeRegionalConfig({
  requireCountryAttestation: true,
  requireAccountAttestation: false,
  minimumSwapLevel: AccessLevel.ACCREDITED,
  minimumLpLevel: AccessLevel.ACCREDITED,
});

await walletClient.writeContract({
  address: getDeployment(8453).policyConfig,
  abi: LexifiPolicyConfigAbi,
  functionName: "setConfig",
  args: [ConfigFamily.regional, poolId, data],
});
```

A pool with no configuration is denied, not open. Clearing config closes a pool.

## Read the audit trail

```typescript
import { base, fetchAuditTrail } from "@lexifi/sdk";

const records = await fetchAuditTrail({
  deployment: base,
  routerAddresses: [myRouter], // routers your users swap through
});
```

Passes come from the hook's event logs. A denied swap reverts, which rolls back its events, so
denials are reconstructed from the routers' reverted transactions through Blockscout and marked
as reconstructed.

## Exports

| Group | Exports |
|---|---|
| Deployments | `base`, `baseSepolia`, `getDeployment`, `NOT_DEPLOYED`, `ConfigFamily` |
| ABIs | `LexifiHookAbi`, `LexifiComplianceAdapterAbi`, `LexifiAllowlistCheckerAbi`, `LexifiPolicyConfigAbi`, `ThresholdPolicyAbi`, `RegionalPolicyV3Abi`, `InstitutionalPolicyV3Abi`, `RegionalPolicyAbi`, `InstitutionalPolicyAbi`, `VerificationProviderAbi`, `SelfAttestationProviderAbi` |
| Constants | `PermissionFlags`, `EventTopics`, `AccessLevel`, `AccessLevelLabels`, `Operation` |
| Helpers | `encodeRegionalConfig`, `encodeInstitutionalConfig`, `fetchAuditTrail` |

`RegionalPolicyAbi` and `InstitutionalPolicyAbi` describe the retired v1 policies and are kept
for reading historical state. New integrations should use the V3 ABIs.

`getDeployment` returns Base Sepolia for chain id `84532` and Base mainnet for every other
chain id, so check the chain yourself before calling it.

## Networks

| Network | Status |
|---|---|
| Base mainnet (8453) | Full deployment |
| Base Sepolia (84532) | Partial and older; several entries are `NOT_DEPLOYED` |

Contract source and deployment history:
[github.com/Gomathi1806/lexifi-contracts](https://github.com/Gomathi1806/lexifi-contracts).

## Development

```bash
npm ci
npm test   # builds, then checks every address is checksummed, no retired contract is
           # referenced, and the config-family keys match their documented strings
```

## License

MIT
