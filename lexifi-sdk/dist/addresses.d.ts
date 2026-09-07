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
export declare const NOT_DEPLOYED: "0x0000000000000000000000000000000000000000";
export declare const base: LexifiDeployment;
export declare const baseSepolia: LexifiDeployment;
export declare function getDeployment(chainId: number): LexifiDeployment;
/**
 * Config-family keys for `LexifiPolicyConfig`. These are `keccak256` of a fixed string and are
 * deliberately CONSTANT across policy logic versions — that is what lets a redeployed policy
 * keep reading the same configuration. Never derive these from a policy address.
 */
export declare const ConfigFamily: {
    readonly regional: "0x0e537700722790c80ce19afbec569da734cc6d5cbda34c936176091f1632b6cd";
    readonly institutional: "0x454961dc0ef2f1fce0aba990c49dbeba12441aada1ba4ff9476a7da4a71b75d8";
};
//# sourceMappingURL=addresses.d.ts.map