import type { AccessLevel } from "./types.js";
/**
 * Helpers for writing policy configuration into `LexifiPolicyConfig`.
 *
 * The registry stores opaque `bytes` — it never decodes, and therefore never validates. The
 * layouts below MUST match the structs the V3 policies decode, or the policy will read
 * garbage. Encoding client-side keeps configuration to a single transaction; the equivalent
 * `encodeConfig` view on each policy contract is the on-chain source of truth if you would
 * rather not trust this file.
 *
 * Because the registry cannot validate, the policies normalise at read time. Two consequences
 * worth knowing before you write:
 *
 * - Regional: `minLp` below `minSwap` is silently clamped UP to `minSwap`. That closes the LP
 *   backdoor (an address barred from swapping could otherwise acquire the asset by minting a
 *   position), but it means the config you read back may be stricter than the one you wrote.
 *   Check `validateConfig(poolId)` to detect it.
 * - Institutional: `minimumProviders` above the provider count is clamped down to that count,
 *   and a stored `0` is raised to `1` so the policy can never become a no-op.
 *
 * There is no "unset" that means open access: a pool with no config is DENIED by the V3
 * policies. Clearing config closes a pool, it does not reopen it.
 */
/** Matches `RegionalPolicyV3.RegionConfig`. */
export declare function encodeRegionalConfig(params: {
    requireCountryAttestation: boolean;
    requireAccountAttestation: boolean;
    minimumSwapLevel: AccessLevel;
    minimumLpLevel: AccessLevel;
}): `0x${string}`;
/** Matches `InstitutionalPolicyV3.InstitutionalConfig`. */
export declare function encodeInstitutionalConfig(params: {
    requiredProviders: readonly `0x${string}`[];
    minimumProviders: bigint;
    minimumTier: AccessLevel;
}): `0x${string}`;
//# sourceMappingURL=policyConfig.d.ts.map