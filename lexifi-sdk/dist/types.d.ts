export declare enum AccessLevel {
    DENIED = 0,
    RETAIL = 1,
    ACCREDITED = 2,
    INSTITUTIONAL = 3
}
export declare const AccessLevelLabels: Record<AccessLevel, string>;
export declare enum Operation {
    SWAP = 0,
    ADD_LIQUIDITY = 1,
    REMOVE_LIQUIDITY = 2
}
export interface PoolKey {
    currency0: `0x${string}`;
    currency1: `0x${string}`;
    fee: number;
    tickSpacing: number;
    hooks: `0x${string}`;
}
export interface ComplianceResult {
    allowed: boolean;
    userLevel: AccessLevel;
    requiredLevel: AccessLevel;
    reason: string;
}
export interface PoolInfo {
    hasCompliance: boolean;
    policy: `0x${string}`;
    policyName: string;
    admin: `0x${string}`;
}
export interface VerificationResult {
    verified: boolean;
    tier: number;
    expiry: bigint;
    attestationId: `0x${string}`;
    providerName: string;
}
export interface ThresholdConfig {
    noKycLimit: bigint;
    enhancedLimit: bigint;
    lpMinimum: AccessLevel;
    swapMinimum: AccessLevel;
    active: boolean;
}
export interface RegionalConfig {
    requireCountryAttestation: boolean;
    requireAccountAttestation: boolean;
    minimumSwapLevel: AccessLevel;
    minimumLpLevel: AccessLevel;
    active: boolean;
}
export interface InstitutionalConfig {
    providers: `0x${string}`[];
    minimumProviders: bigint;
    minimumTier: AccessLevel;
    active: boolean;
}
export interface AuditRecord {
    txHash: string;
    blockNumber: number;
    timestamp: string;
    poolId: string;
    user: string;
    operation: Operation;
    amount: bigint;
    passed: boolean;
    userLevel: AccessLevel;
    requiredLevel: AccessLevel;
    reason: string;
    source: "event" | "failed-tx";
}
//# sourceMappingURL=types.d.ts.map