export interface LexifiDeployment {
  chainId: number;
  hook: `0x${string}`;
  coinbaseProvider: `0x${string}`;
  thresholdPolicy: `0x${string}`;
  regionalPolicy: `0x${string}`;
  institutionalPolicy: `0x${string}`;
  selfAttestationProvider: `0x${string}`;
  /**
   * Single-call compliance entry point for third-party hooks.
   * `checkCompliance(poolId, user, operation, amount)` — one staticcall, no state change.
   */
  complianceAdapter: `0x${string}`;
  /**
   * `IAllowlistChecker` implementation for Uniswap v4 Permissioned Pools. Register it on a
   * `PermissionsAdapter` via `updateAllowListChecker` to have Lexifi policies drive the
   * pool's allowlist instead of a hand-maintained address list.
   *
   * Note: `checkAllowlist` receives no pool id, no operation and no trade size, and is
   * `view`. Amount-based gating and the on-chain denial audit trail are therefore NOT
   * available on this path — use the hook directly for pools that need either.
   */
  allowlistChecker: `0x${string}`;
  /**
   * Shared per-pool policy configuration store. Config is keyed by
   * `(CONFIG_FAMILY, poolId)` rather than by policy address, so redeploying policy logic no
   * longer loses configuration. `regionalPolicy` and `institutionalPolicy` (v3) read from it;
   * `thresholdPolicy` still keeps its own storage.
   */
  policyConfig: `0x${string}`;
  poolManager: `0x${string}`;
  explorer: string;
  blockscoutApi: string;
}

/** Not deployed on this network. */
export const NOT_DEPLOYED = "0x0000000000000000000000000000000000000000" as const;

export const base: LexifiDeployment = {
  chainId: 8453,
  hook: "0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880",
  coinbaseProvider: "0xb5DEC225A104A276671A765aba3890EC88A2ca27",
  thresholdPolicy: "0x75f4913F53B694fDda95E49456D163Ca7AEf4199",
  // v3 (2026-09-07): registry-backed config, fail-closed on unconfigured pools, and all three
  // policy audit findings fixed. Superseded v1 `0xA99A89Cd5A61e975fB11047D3ed455fCCad9A44F`
  // and `0xaD09fc63080736b1dFC4048F3589C481225db5fb`, which remain on-chain but must not be
  // used: RegionalPolicy v1's requirement flags did not deny, and InstitutionalPolicy v1's
  // N-of-M quorum did not gate.
  regionalPolicy: "0x5309C741094e8901f9D2Ad1f31DC560006542a82",
  institutionalPolicy: "0xdA93C63212CF41dB3680319B3839f254aC319177",
  selfAttestationProvider: "0x344E4917360F5b44680D097c5E4904Ac62c00483",
  complianceAdapter: "0xe59fB4347Ca17aA94BBd62eBb9921877b06B68eE",
  allowlistChecker: "0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc",
  policyConfig: "0x9E005c201AEe5Db3c67b3658Cc18723dfDEe42E1",
  poolManager: "0x498581fF718922c3f8e6A244956aF099B2652b2b",
  explorer: "https://basescan.org",
  blockscoutApi: "https://base.blockscout.com/api/v2",
};

export const baseSepolia: LexifiDeployment = {
  chainId: 84532,
  hook: "0x5b814ad56562a9Ee47776A382C6aF678B07aa880",
  coinbaseProvider: "0xD40C35303FFF70E36A2Ea74fAC66de5D191bA6d8",
  thresholdPolicy: "0xB2228cd33A2E4004c0e14fe9510E93df1d3aC2b2",
  regionalPolicy: NOT_DEPLOYED,
  institutionalPolicy: "0xe05d670802DF1a2FD0F5875439EFA40dfA1A5AEd",
  selfAttestationProvider: NOT_DEPLOYED,
  complianceAdapter: NOT_DEPLOYED,
  allowlistChecker: NOT_DEPLOYED,
  policyConfig: NOT_DEPLOYED,
  poolManager: "0x05E73354cFDd6745C338b50BDB65F6c2F4163313",
  explorer: "https://sepolia.basescan.org",
  blockscoutApi: "https://base-sepolia.blockscout.com/api/v2",
};

export function getDeployment(chainId: number): LexifiDeployment {
  if (chainId === 84532) return baseSepolia;
  return base;
}

/**
 * Config-family keys for `LexifiPolicyConfig`. These are `keccak256` of a fixed string and are
 * deliberately CONSTANT across policy logic versions — that is what lets a redeployed policy
 * keep reading the same configuration. Never derive these from a policy address.
 */
export const ConfigFamily = {
  regional: "0x0e537700722790c80ce19afbec569da734cc6d5cbda34c936176091f1632b6cd",
  institutional: "0x454961dc0ef2f1fce0aba990c49dbeba12441aada1ba4ff9476a7da4a71b75d8",
} as const;
