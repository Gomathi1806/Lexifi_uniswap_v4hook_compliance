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
export declare const NOT_DEPLOYED: "0x0000000000000000000000000000000000000000";
export declare const base: LexifiDeployment;
export declare const baseSepolia: LexifiDeployment;
export declare function getDeployment(chainId: number): LexifiDeployment;
//# sourceMappingURL=addresses.d.ts.map