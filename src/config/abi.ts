export const HOOK_ABI = [
  { inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "user", type: "address" },{ name: "operation", type: "uint8" },{ name: "amount", type: "uint256" }], name: "checkUserCompliance", outputs: [{ name: "allowed", type: "bool" },{ name: "userLevel", type: "uint8" },{ name: "requiredLevel", type: "uint8" },{ name: "reason", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]}], name: "getPoolInfo", outputs: [{ name: "hasCompliance", type: "bool" },{ name: "policy", type: "address" },{ name: "policyName", type: "string" },{ name: "admin", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "policy", type: "address" }], name: "setPoolPolicy", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "newAdmin", type: "address" }], name: "transferPoolAdmin", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "totalChecks", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalPools", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "bytes32" }], name: "poolPolicy", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "bytes32" }], name: "poolAdmin", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "bytes32" }], name: "isCompliancePool", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "policy", type: "address" }], name: "approvePolicy", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "policy", type: "address" }], name: "revokePolicy", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_require", type: "bool" }], name: "setRequireApproval", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "", type: "address" }], name: "approvedPolicies", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "requireApproval", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
] as const;

export const THRESHOLD_POLICY_ABI = [
  { inputs: [{ name: "", type: "bytes32" }], name: "configs", outputs: [{ name: "noKycLimit", type: "uint256" },{ name: "enhancedLimit", type: "uint256" },{ name: "lpMinimum", type: "uint8" },{ name: "swapMinimum", type: "uint8" },{ name: "active", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "poolId", type: "bytes32" },{ name: "noKycLimit", type: "uint256" },{ name: "enhancedLimit", type: "uint256" },{ name: "lpMinimum", type: "uint8" },{ name: "swapMinimum", type: "uint8" }], name: "setPoolConfig", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "policyName", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
] as const;

export const PROVIDER_ABI = [
  { inputs: [{ name: "user", type: "address" }], name: "verify", outputs: [{ name: "result", type: "tuple", components: [{ name: "verified", type: "bool" },{ name: "tier", type: "uint256" },{ name: "expiry", type: "uint256" },{ name: "attestationId", type: "bytes32" },{ name: "providerName", type: "string" }] }], stateMutability: "view", type: "function" },
  { inputs: [], name: "providerName", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
] as const;
