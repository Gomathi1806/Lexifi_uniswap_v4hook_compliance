export const LexifiHookAbi = [
  { type: "function", name: "setPoolPolicy", inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "policy", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferPoolAdmin", inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "newAdmin", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "checkUserCompliance", inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], outputs: [{ name: "allowed", type: "bool" },{ name: "userLevel", type: "uint8" },{ name: "requiredLevel", type: "uint8" },{ name: "reason", type: "string" }], stateMutability: "view" },
  { type: "function", name: "getPoolInfo", inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]}], outputs: [{ name: "hasCompliance", type: "bool" },{ name: "policy", type: "address" },{ name: "policyName", type: "string" },{ name: "admin", type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalChecks", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalPools", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "poolPolicy", inputs: [{ name: "", type: "bytes32" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "poolAdmin", inputs: [{ name: "", type: "bytes32" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "isCompliancePool", inputs: [{ name: "", type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "approvePolicy", inputs: [{ name: "policy", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "revokePolicy", inputs: [{ name: "policy", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setRequireApproval", inputs: [{ name: "_require", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "approvedPolicies", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "requireApproval", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "trustedRouters", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "setTrustedRouter", inputs: [{ name: "router", type: "address" },{ name: "trusted", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferOwnership", inputs: [{ name: "newOwner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "error", name: "ComplianceDenied", inputs: [{ name: "user", type: "address" },{ name: "required", type: "uint8" },{ name: "actual", type: "uint8" },{ name: "reason", type: "string" }] },
  { type: "error", name: "PolicyNotApproved", inputs: [{ name: "policy", type: "address" }] },
  { type: "error", name: "InvalidPolicy", inputs: [{ name: "policy", type: "address" }] },
  { type: "error", name: "NotPoolAdmin", inputs: [{ name: "caller", type: "address" },{ name: "poolId", type: "bytes32" }] },
  { type: "error", name: "OnlyOwner", inputs: [] },
  { type: "error", name: "OnlyPoolManager", inputs: [] },
  { type: "event", name: "TrustedRouterSet", inputs: [{ name: "router", type: "address", indexed: true },{ name: "trusted", type: "bool", indexed: false }] },
] as const;

export const ThresholdPolicyAbi = [
  { type: "function", name: "setPoolConfig", inputs: [{ name: "poolId", type: "bytes32" },{ name: "noKycLimit", type: "uint256" },{ name: "enhancedLimit", type: "uint256" },{ name: "lpMinimum", type: "uint8" },{ name: "swapMinimum", type: "uint8" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "configs", inputs: [{ name: "", type: "bytes32" }], outputs: [{ name: "noKycLimit", type: "uint256" },{ name: "enhancedLimit", type: "uint256" },{ name: "lpMinimum", type: "uint8" },{ name: "swapMinimum", type: "uint8" },{ name: "active", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "policyName", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "policyVersion", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "checkAccess", inputs: [{ name: "poolId", type: "bytes32" },{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], outputs: [{ name: "level", type: "uint8" },{ name: "reason", type: "string" }], stateMutability: "view" },
  { type: "function", name: "minimumLevel", inputs: [{ name: "poolId", type: "bytes32" },{ name: "operation", type: "uint8" }], outputs: [{ type: "uint8" }], stateMutability: "view" },
] as const;

export const RegionalPolicyAbi = [
  { type: "function", name: "setRegionConfig", inputs: [{ name: "poolId", type: "bytes32" },{ name: "requireCountry", type: "bool" },{ name: "requireAccount", type: "bool" },{ name: "minSwap", type: "uint8" },{ name: "minLp", type: "uint8" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "regionConfigs", inputs: [{ name: "", type: "bytes32" }], outputs: [{ name: "requireCountryAttestation", type: "bool" },{ name: "requireAccountAttestation", type: "bool" },{ name: "minimumSwapLevel", type: "uint8" },{ name: "minimumLpLevel", type: "uint8" },{ name: "active", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "poolAdmins", inputs: [{ name: "", type: "bytes32" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "policyName", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "policyVersion", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "checkAccess", inputs: [{ name: "poolId", type: "bytes32" },{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], outputs: [{ name: "level", type: "uint8" },{ name: "reason", type: "string" }], stateMutability: "view" },
  { type: "function", name: "minimumLevel", inputs: [{ name: "poolId", type: "bytes32" },{ name: "operation", type: "uint8" }], outputs: [{ type: "uint8" }], stateMutability: "view" },
] as const;

export const InstitutionalPolicyAbi = [
  { type: "function", name: "setInstitutionalConfig", inputs: [{ name: "poolId", type: "bytes32" },{ name: "providers", type: "address[]" },{ name: "minProviders", type: "uint256" },{ name: "minTier", type: "uint8" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getConfig", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ name: "providers", type: "address[]" },{ name: "minProviders", type: "uint256" },{ name: "minTier", type: "uint8" },{ name: "active", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "poolAdmins", inputs: [{ name: "", type: "bytes32" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "policyName", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "policyVersion", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "checkAccess", inputs: [{ name: "poolId", type: "bytes32" },{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], outputs: [{ name: "level", type: "uint8" },{ name: "reason", type: "string" }], stateMutability: "view" },
  { type: "function", name: "minimumLevel", inputs: [{ name: "poolId", type: "bytes32" },{ name: "operation", type: "uint8" }], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "error", name: "Unauthorized", inputs: [] },
  { type: "error", name: "TooFewProviders", inputs: [] },
] as const;

export const VerificationProviderAbi = [
  { type: "function", name: "verify", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "result", type: "tuple", components: [{ name: "verified", type: "bool" },{ name: "tier", type: "uint256" },{ name: "expiry", type: "uint256" },{ name: "attestationId", type: "bytes32" },{ name: "providerName", type: "string" }] }], stateMutability: "view" },
  { type: "function", name: "providerId", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "providerName", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "supportsType", inputs: [{ name: "verificationType", type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
] as const;

export const SelfAttestationProviderAbi = [
  { type: "function", name: "verify", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "result", type: "tuple", components: [{ name: "verified", type: "bool" },{ name: "tier", type: "uint256" },{ name: "expiry", type: "uint256" },{ name: "attestationId", type: "bytes32" },{ name: "providerName", type: "string" }] }], stateMutability: "view" },
  { type: "function", name: "providerId", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "providerName", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "supportsType", inputs: [{ name: "verificationType", type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "attest", inputs: [{ name: "user", type: "address" },{ name: "tier", type: "uint256" },{ name: "expiry", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "attestBatch", inputs: [{ name: "users", type: "address[]" },{ name: "tiers", type: "uint256[]" },{ name: "expiries", type: "uint256[]" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "revoke", inputs: [{ name: "user", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "attestations", inputs: [{ name: "", type: "address" }], outputs: [{ name: "tier", type: "uint256" },{ name: "expiry", type: "uint256" },{ name: "attestedAt", type: "uint256" },{ name: "active", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "operatorName", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "transferOwnership", inputs: [{ name: "newOwner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "event", name: "UserAttested", inputs: [{ name: "user", type: "address", indexed: true },{ name: "tier", type: "uint256", indexed: false },{ name: "expiry", type: "uint256", indexed: false }] },
  { type: "event", name: "UserRevoked", inputs: [{ name: "user", type: "address", indexed: true }] },
  { type: "event", name: "OwnershipTransferred", inputs: [{ name: "oldOwner", type: "address", indexed: true },{ name: "newOwner", type: "address", indexed: true }] },
  { type: "error", name: "Unauthorized", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
] as const;

/** Single-call compliance check for third-party hooks (Aqua0 V4Adapter and friends). */
export const LexifiComplianceAdapterAbi = [
  { type: "function", name: "checkCompliance", inputs: [{ name: "poolId", type: "bytes32" },{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], outputs: [{ name: "allowed", type: "bool" },{ name: "userTier", type: "uint8" },{ name: "requiredTier", type: "uint8" },{ name: "reason", type: "string" }], stateMutability: "view" },
  { type: "function", name: "hasPolicy", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "lexifiHook", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
] as const;

/**
 * `IAllowlistChecker` for Uniswap v4 Permissioned Pools.
 * `checkAllowlist` returns bytes2 permission flags: SWAP_ALLOWED 0x0001, LIQUIDITY_ALLOWED
 * 0x0002. Uniswap's PermissionsAdapter tests them as `(flags & permission) == permission`.
 * Prefer `previewPermissions` in UI — it returns the denial reason the flags discard.
 */
export const LexifiAllowlistCheckerAbi = [
  { type: "function", name: "checkAllowlist", inputs: [{ name: "account", type: "address" },{ name: "tokenAddress", type: "address" }], outputs: [{ type: "bytes2" }], stateMutability: "view" },
  { type: "function", name: "previewPermissions", inputs: [{ name: "account", type: "address" },{ name: "tokenAddress", type: "address" }], outputs: [{ name: "swapAllowed", type: "bool" },{ name: "liquidityAllowed", type: "bool" },{ name: "userTier", type: "uint8" },{ name: "requiredSwapTier", type: "uint8" },{ name: "reason", type: "string" }], stateMutability: "view" },
  { type: "function", name: "isTokenGoverned", inputs: [{ name: "tokenAddress", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "bindings", inputs: [{ name: "", type: "address" }], outputs: [{ name: "poolId", type: "bytes32" },{ name: "evaluationAmount", type: "uint256" },{ name: "liquidityRequiresSwap", type: "bool" },{ name: "active", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "compliance", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "paused", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "supportsInterface", inputs: [{ name: "interfaceId", type: "bytes4" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "bindToken", inputs: [{ name: "token", type: "address" },{ name: "poolId", type: "bytes32" },{ name: "evaluationAmount", type: "uint256" },{ name: "liquidityRequiresSwap", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unbindToken", inputs: [{ name: "token", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setEvaluationAmount", inputs: [{ name: "token", type: "address" },{ name: "newAmount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setPaused", inputs: [{ name: "_paused", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferOwnership", inputs: [{ name: "newOwner", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "event", name: "TokenBound", inputs: [{ name: "token", type: "address", indexed: true },{ name: "poolId", type: "bytes32", indexed: true },{ name: "evaluationAmount", type: "uint256", indexed: false },{ name: "liquidityRequiresSwap", type: "bool", indexed: false }] },
  { type: "event", name: "TokenUnbound", inputs: [{ name: "token", type: "address", indexed: true }] },
  { type: "event", name: "EvaluationAmountUpdated", inputs: [{ name: "token", type: "address", indexed: true },{ name: "oldAmount", type: "uint256", indexed: false },{ name: "newAmount", type: "uint256", indexed: false }] },
  { type: "event", name: "PausedSet", inputs: [{ name: "paused", type: "bool", indexed: false }] },
  { type: "event", name: "OwnershipTransferred", inputs: [{ name: "previousOwner", type: "address", indexed: true },{ name: "newOwner", type: "address", indexed: true }] },
  { type: "error", name: "OnlyOwner", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "TokenNotBound", inputs: [{ name: "token", type: "address" }] },
  { type: "error", name: "ZeroEvaluationAmount", inputs: [] },
] as const;

/** Uniswap v4 Permissioned Pools permission flags (bytes2), from PermissionFlags.sol. */
export const PermissionFlags = {
  NONE: "0x0000",
  SWAP_ALLOWED: "0x0001",
  LIQUIDITY_ALLOWED: "0x0002",
  ALL_ALLOWED: "0xffff",
} as const;

export const EventTopics = {
  ComplianceCheckPassed: "0x175e4a816ea96f239cfe049470f5f6177b6875247a835208c43fb2c7f54f7a4f",
  ComplianceCheckFailed: "0x26217f4ddf912008a58466c93222a8b3834fd80c89af3868a837d2390d93df04",
  PoolPolicySet: "0x0e165c569af9acc2de6dd8d2fbcabcb6a851688a45eeaeb6e225e33ab3704364",
  PoolPolicyUpdated: "0x33bfaeb08a37d7651827236e5cc752c57eaee6011f76723c463ca0fc82665ec0",
} as const;

/**
 * `LexifiPolicyConfig` — shared per-pool policy configuration store (deployed 2026-09-07).
 *
 * Config is keyed by `(family, poolId)`, where `family` is a constant a policy declares and
 * keeps across logic versions. That is what makes a policy redeploy migration-free. The store
 * holds opaque `bytes`; each policy family owns its own struct layout. Encode with
 * `encodeRegionalConfig` / `encodeInstitutionalConfig`.
 */
export const LexifiPolicyConfigAbi = [
  { type: "function", name: "setConfig", inputs: [{ name: "family", type: "bytes32" },{ name: "poolId", type: "bytes32" },{ name: "data", type: "bytes" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setConfigBatch", inputs: [{ name: "family", type: "bytes32" },{ name: "poolIds", type: "bytes32[]" },{ name: "datas", type: "bytes[]" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "clearConfig", inputs: [{ name: "family", type: "bytes32" },{ name: "poolId", type: "bytes32" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferPoolAdmin", inputs: [{ name: "family", type: "bytes32" },{ name: "poolId", type: "bytes32" },{ name: "newAdmin", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getConfig", inputs: [{ name: "family", type: "bytes32" },{ name: "poolId", type: "bytes32" }], outputs: [{ type: "bytes" }], stateMutability: "view" },
  { type: "function", name: "isConfigured", inputs: [{ name: "family", type: "bytes32" },{ name: "poolId", type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "poolAdmin", inputs: [{ name: "family", type: "bytes32" },{ name: "poolId", type: "bytes32" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "event", name: "ConfigSet", inputs: [{ name: "family", type: "bytes32", indexed: true },{ name: "poolId", type: "bytes32", indexed: true },{ name: "admin", type: "address", indexed: true },{ name: "data", type: "bytes", indexed: false }] },
  { type: "event", name: "ConfigCleared", inputs: [{ name: "family", type: "bytes32", indexed: true },{ name: "poolId", type: "bytes32", indexed: true },{ name: "admin", type: "address", indexed: true }] },
] as const;

/**
 * `RegionalPolicyV3`. Note there is NO `setRegionConfig` — writes go through
 * `LexifiPolicyConfig.setConfig`. `effectiveConfig` returns the config AFTER normalisation
 * (`minLp` is clamped up to `minSwap`), so it is what the policy actually enforces;
 * `validateConfig` reports whether the stored value needed that clamp.
 */
export const RegionalPolicyV3Abi = [
  { type: "function", name: "checkAccess", inputs: [{ name: "poolId", type: "bytes32" },{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], outputs: [{ type: "uint8" },{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "minimumLevel", inputs: [{ name: "poolId", type: "bytes32" },{ name: "operation", type: "uint8" }], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "effectiveConfig", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "tuple", components: [{ name: "requireCountryAttestation", type: "bool" },{ name: "requireAccountAttestation", type: "bool" },{ name: "minimumSwapLevel", type: "uint8" },{ name: "minimumLpLevel", type: "uint8" },{ name: "active", type: "bool" }] },{ name: "configured", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "validateConfig", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "encodeConfig", inputs: [{ name: "requireCountry", type: "bool" },{ name: "requireAccount", type: "bool" },{ name: "minSwap", type: "uint8" },{ name: "minLp", type: "uint8" }], outputs: [{ type: "bytes" }], stateMutability: "pure" },
  { type: "function", name: "CONFIG_FAMILY", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "configRegistry", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "policyName", inputs: [], outputs: [{ type: "string" }], stateMutability: "pure" },
  { type: "function", name: "policyVersion", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "pure" },
] as const;

/** `InstitutionalPolicyV3`. Writes go through `LexifiPolicyConfig.setConfig`. */
export const InstitutionalPolicyV3Abi = [
  { type: "function", name: "checkAccess", inputs: [{ name: "poolId", type: "bytes32" },{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], outputs: [{ type: "uint8" },{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "minimumLevel", inputs: [{ name: "poolId", type: "bytes32" },{ name: "operation", type: "uint8" }], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "effectiveConfig", inputs: [{ name: "poolId", type: "bytes32" }], outputs: [{ type: "tuple", components: [{ name: "requiredProviders", type: "address[]" },{ name: "minimumProviders", type: "uint256" },{ name: "minimumTier", type: "uint8" },{ name: "active", type: "bool" }] },{ name: "configured", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "encodeConfig", inputs: [{ name: "providers", type: "address[]" },{ name: "minProviders", type: "uint256" },{ name: "minTier", type: "uint8" }], outputs: [{ type: "bytes" }], stateMutability: "pure" },
  { type: "function", name: "CONFIG_FAMILY", inputs: [], outputs: [{ type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "configRegistry", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "policyName", inputs: [], outputs: [{ type: "string" }], stateMutability: "pure" },
  { type: "function", name: "policyVersion", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "pure" },
] as const;
