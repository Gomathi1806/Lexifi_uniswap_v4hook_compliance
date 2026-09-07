export declare const LexifiHookAbi: readonly [{
    readonly type: "function";
    readonly name: "setPoolPolicy";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "currency0";
            readonly type: "address";
        }, {
            readonly name: "currency1";
            readonly type: "address";
        }, {
            readonly name: "fee";
            readonly type: "uint24";
        }, {
            readonly name: "tickSpacing";
            readonly type: "int24";
        }, {
            readonly name: "hooks";
            readonly type: "address";
        }];
    }, {
        readonly name: "policy";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "transferPoolAdmin";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "currency0";
            readonly type: "address";
        }, {
            readonly name: "currency1";
            readonly type: "address";
        }, {
            readonly name: "fee";
            readonly type: "uint24";
        }, {
            readonly name: "tickSpacing";
            readonly type: "int24";
        }, {
            readonly name: "hooks";
            readonly type: "address";
        }];
    }, {
        readonly name: "newAdmin";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "checkUserCompliance";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "currency0";
            readonly type: "address";
        }, {
            readonly name: "currency1";
            readonly type: "address";
        }, {
            readonly name: "fee";
            readonly type: "uint24";
        }, {
            readonly name: "tickSpacing";
            readonly type: "int24";
        }, {
            readonly name: "hooks";
            readonly type: "address";
        }];
    }, {
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "allowed";
        readonly type: "bool";
    }, {
        readonly name: "userLevel";
        readonly type: "uint8";
    }, {
        readonly name: "requiredLevel";
        readonly type: "uint8";
    }, {
        readonly name: "reason";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPoolInfo";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "currency0";
            readonly type: "address";
        }, {
            readonly name: "currency1";
            readonly type: "address";
        }, {
            readonly name: "fee";
            readonly type: "uint24";
        }, {
            readonly name: "tickSpacing";
            readonly type: "int24";
        }, {
            readonly name: "hooks";
            readonly type: "address";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "hasCompliance";
        readonly type: "bool";
    }, {
        readonly name: "policy";
        readonly type: "address";
    }, {
        readonly name: "policyName";
        readonly type: "string";
    }, {
        readonly name: "admin";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalChecks";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "totalPools";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "owner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "poolPolicy";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "poolAdmin";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isCompliancePool";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "approvePolicy";
    readonly inputs: readonly [{
        readonly name: "policy";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "revokePolicy";
    readonly inputs: readonly [{
        readonly name: "policy";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setRequireApproval";
    readonly inputs: readonly [{
        readonly name: "_require";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "approvedPolicies";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "requireApproval";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "trustedRouters";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "setTrustedRouter";
    readonly inputs: readonly [{
        readonly name: "router";
        readonly type: "address";
    }, {
        readonly name: "trusted";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "transferOwnership";
    readonly inputs: readonly [{
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "error";
    readonly name: "ComplianceDenied";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "required";
        readonly type: "uint8";
    }, {
        readonly name: "actual";
        readonly type: "uint8";
    }, {
        readonly name: "reason";
        readonly type: "string";
    }];
}, {
    readonly type: "error";
    readonly name: "PolicyNotApproved";
    readonly inputs: readonly [{
        readonly name: "policy";
        readonly type: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "InvalidPolicy";
    readonly inputs: readonly [{
        readonly name: "policy";
        readonly type: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "NotPoolAdmin";
    readonly inputs: readonly [{
        readonly name: "caller";
        readonly type: "address";
    }, {
        readonly name: "poolId";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "error";
    readonly name: "OnlyOwner";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OnlyPoolManager";
    readonly inputs: readonly [];
}, {
    readonly type: "event";
    readonly name: "TrustedRouterSet";
    readonly inputs: readonly [{
        readonly name: "router";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "trusted";
        readonly type: "bool";
        readonly indexed: false;
    }];
}];
export declare const ThresholdPolicyAbi: readonly [{
    readonly type: "function";
    readonly name: "setPoolConfig";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "noKycLimit";
        readonly type: "uint256";
    }, {
        readonly name: "enhancedLimit";
        readonly type: "uint256";
    }, {
        readonly name: "lpMinimum";
        readonly type: "uint8";
    }, {
        readonly name: "swapMinimum";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "configs";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "noKycLimit";
        readonly type: "uint256";
    }, {
        readonly name: "enhancedLimit";
        readonly type: "uint256";
    }, {
        readonly name: "lpMinimum";
        readonly type: "uint8";
    }, {
        readonly name: "swapMinimum";
        readonly type: "uint8";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "policyName";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "policyVersion";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "checkAccess";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "level";
        readonly type: "uint8";
    }, {
        readonly name: "reason";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "minimumLevel";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [{
        readonly type: "uint8";
    }];
    readonly stateMutability: "view";
}];
export declare const RegionalPolicyAbi: readonly [{
    readonly type: "function";
    readonly name: "setRegionConfig";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "requireCountry";
        readonly type: "bool";
    }, {
        readonly name: "requireAccount";
        readonly type: "bool";
    }, {
        readonly name: "minSwap";
        readonly type: "uint8";
    }, {
        readonly name: "minLp";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "regionConfigs";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "requireCountryAttestation";
        readonly type: "bool";
    }, {
        readonly name: "requireAccountAttestation";
        readonly type: "bool";
    }, {
        readonly name: "minimumSwapLevel";
        readonly type: "uint8";
    }, {
        readonly name: "minimumLpLevel";
        readonly type: "uint8";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "poolAdmins";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "policyName";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "policyVersion";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "checkAccess";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "level";
        readonly type: "uint8";
    }, {
        readonly name: "reason";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "minimumLevel";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [{
        readonly type: "uint8";
    }];
    readonly stateMutability: "view";
}];
export declare const InstitutionalPolicyAbi: readonly [{
    readonly type: "function";
    readonly name: "setInstitutionalConfig";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "providers";
        readonly type: "address[]";
    }, {
        readonly name: "minProviders";
        readonly type: "uint256";
    }, {
        readonly name: "minTier";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "getConfig";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "providers";
        readonly type: "address[]";
    }, {
        readonly name: "minProviders";
        readonly type: "uint256";
    }, {
        readonly name: "minTier";
        readonly type: "uint8";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "poolAdmins";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "policyName";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "policyVersion";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "checkAccess";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "level";
        readonly type: "uint8";
    }, {
        readonly name: "reason";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "minimumLevel";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [{
        readonly type: "uint8";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "error";
    readonly name: "Unauthorized";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "TooFewProviders";
    readonly inputs: readonly [];
}];
export declare const VerificationProviderAbi: readonly [{
    readonly type: "function";
    readonly name: "verify";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "result";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "verified";
            readonly type: "bool";
        }, {
            readonly name: "tier";
            readonly type: "uint256";
        }, {
            readonly name: "expiry";
            readonly type: "uint256";
        }, {
            readonly name: "attestationId";
            readonly type: "bytes32";
        }, {
            readonly name: "providerName";
            readonly type: "string";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "providerId";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "providerName";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "supportsType";
    readonly inputs: readonly [{
        readonly name: "verificationType";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}];
export declare const SelfAttestationProviderAbi: readonly [{
    readonly type: "function";
    readonly name: "verify";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "result";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "verified";
            readonly type: "bool";
        }, {
            readonly name: "tier";
            readonly type: "uint256";
        }, {
            readonly name: "expiry";
            readonly type: "uint256";
        }, {
            readonly name: "attestationId";
            readonly type: "bytes32";
        }, {
            readonly name: "providerName";
            readonly type: "string";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "providerId";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "providerName";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "supportsType";
    readonly inputs: readonly [{
        readonly name: "verificationType";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "attest";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "tier";
        readonly type: "uint256";
    }, {
        readonly name: "expiry";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "attestBatch";
    readonly inputs: readonly [{
        readonly name: "users";
        readonly type: "address[]";
    }, {
        readonly name: "tiers";
        readonly type: "uint256[]";
    }, {
        readonly name: "expiries";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "revoke";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "attestations";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "tier";
        readonly type: "uint256";
    }, {
        readonly name: "expiry";
        readonly type: "uint256";
    }, {
        readonly name: "attestedAt";
        readonly type: "uint256";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "owner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "operatorName";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "transferOwnership";
    readonly inputs: readonly [{
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly name: "UserAttested";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "tier";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "expiry";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "UserRevoked";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "event";
    readonly name: "OwnershipTransferred";
    readonly inputs: readonly [{
        readonly name: "oldOwner";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "newOwner";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "error";
    readonly name: "Unauthorized";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "ZeroAddress";
    readonly inputs: readonly [];
}];
/** Single-call compliance check for third-party hooks (Aqua0 V4Adapter and friends). */
export declare const LexifiComplianceAdapterAbi: readonly [{
    readonly type: "function";
    readonly name: "checkCompliance";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "operation";
        readonly type: "uint8";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "allowed";
        readonly type: "bool";
    }, {
        readonly name: "userTier";
        readonly type: "uint8";
    }, {
        readonly name: "requiredTier";
        readonly type: "uint8";
    }, {
        readonly name: "reason";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "hasPolicy";
    readonly inputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "lexifiHook";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}];
/**
 * `IAllowlistChecker` for Uniswap v4 Permissioned Pools.
 * `checkAllowlist` returns bytes2 permission flags: SWAP_ALLOWED 0x0001, LIQUIDITY_ALLOWED
 * 0x0002. Uniswap's PermissionsAdapter tests them as `(flags & permission) == permission`.
 * Prefer `previewPermissions` in UI — it returns the denial reason the flags discard.
 */
export declare const LexifiAllowlistCheckerAbi: readonly [{
    readonly type: "function";
    readonly name: "checkAllowlist";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly name: "tokenAddress";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bytes2";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "previewPermissions";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly name: "tokenAddress";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "swapAllowed";
        readonly type: "bool";
    }, {
        readonly name: "liquidityAllowed";
        readonly type: "bool";
    }, {
        readonly name: "userTier";
        readonly type: "uint8";
    }, {
        readonly name: "requiredSwapTier";
        readonly type: "uint8";
    }, {
        readonly name: "reason";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isTokenGoverned";
    readonly inputs: readonly [{
        readonly name: "tokenAddress";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "bindings";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "evaluationAmount";
        readonly type: "uint256";
    }, {
        readonly name: "liquidityRequiresSwap";
        readonly type: "bool";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "compliance";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "owner";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "paused";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "supportsInterface";
    readonly inputs: readonly [{
        readonly name: "interfaceId";
        readonly type: "bytes4";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "bindToken";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "poolId";
        readonly type: "bytes32";
    }, {
        readonly name: "evaluationAmount";
        readonly type: "uint256";
    }, {
        readonly name: "liquidityRequiresSwap";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "unbindToken";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setEvaluationAmount";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "newAmount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setPaused";
    readonly inputs: readonly [{
        readonly name: "_paused";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "transferOwnership";
    readonly inputs: readonly [{
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly name: "TokenBound";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "poolId";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "evaluationAmount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "liquidityRequiresSwap";
        readonly type: "bool";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "TokenUnbound";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "event";
    readonly name: "EvaluationAmountUpdated";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "oldAmount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "newAmount";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "PausedSet";
    readonly inputs: readonly [{
        readonly name: "paused";
        readonly type: "bool";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "OwnershipTransferred";
    readonly inputs: readonly [{
        readonly name: "previousOwner";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "newOwner";
        readonly type: "address";
        readonly indexed: true;
    }];
}, {
    readonly type: "error";
    readonly name: "OnlyOwner";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "ZeroAddress";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "TokenNotBound";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }];
}, {
    readonly type: "error";
    readonly name: "ZeroEvaluationAmount";
    readonly inputs: readonly [];
}];
/** Uniswap v4 Permissioned Pools permission flags (bytes2), from PermissionFlags.sol. */
export declare const PermissionFlags: {
    readonly NONE: "0x0000";
    readonly SWAP_ALLOWED: "0x0001";
    readonly LIQUIDITY_ALLOWED: "0x0002";
    readonly ALL_ALLOWED: "0xffff";
};
export declare const EventTopics: {
    readonly ComplianceCheckPassed: "0x175e4a816ea96f239cfe049470f5f6177b6875247a835208c43fb2c7f54f7a4f";
    readonly ComplianceCheckFailed: "0x26217f4ddf912008a58466c93222a8b3834fd80c89af3868a837d2390d93df04";
    readonly PoolPolicySet: "0x0e165c569af9acc2de6dd8d2fbcabcb6a851688a45eeaeb6e225e33ab3704364";
    readonly PoolPolicyUpdated: "0x33bfaeb08a37d7651827236e5cc752c57eaee6011f76723c463ca0fc82665ec0";
};
//# sourceMappingURL=abis.d.ts.map