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
  regionalPolicy: "0xA99A89Cd5A61e975fB11047D3ed455fCCad9A44F",
  institutionalPolicy: "0xaD09fc63080736b1dFC4048F3589C481225db5fb",
  selfAttestationProvider: "0x344E4917360F5b44680D097c5E4904Ac62c00483",
  complianceAdapter: "0xe59fB4347Ca17aA94BBd62eBb9921877b06B68eE",
  allowlistChecker: "0x3882cD541634b99DabB5443Dc0DC67Ba4eDe94bc",
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
  poolManager: "0x05E73354cFDd6745C338b50BDB65F6c2F4163313",
  explorer: "https://sepolia.basescan.org",
  blockscoutApi: "https://base-sepolia.blockscout.com/api/v2",
};

export function getDeployment(chainId: number): LexifiDeployment {
  if (chainId === 84532) return baseSepolia;
  return base;
}
