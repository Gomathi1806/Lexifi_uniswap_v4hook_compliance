export {
  LexifiHookAbi as HOOK_ABI,
  ThresholdPolicyAbi as THRESHOLD_POLICY_ABI,
  RegionalPolicyAbi as REGIONAL_POLICY_ABI,
  InstitutionalPolicyAbi as INSTITUTIONAL_POLICY_ABI,
  VerificationProviderAbi as PROVIDER_ABI,
  SelfAttestationProviderAbi as SELF_ATTESTATION_ABI,
  EventTopics,
} from "@lexifi/sdk";

export const COMPLIANCE_PASSED_TOPIC = "0x175e4a816ea96f239cfe049470f5f6177b6875247a835208c43fb2c7f54f7a4f" as const;
export const AUDIT_RECORD_TOPIC = "0x26217f4ddf912008a58466c93222a8b3834fd80c89af3868a837d2390d93df04" as const;
export const POOL_POLICY_SET_TOPIC = "0x0e165c569af9acc2de6dd8d2fbcabcb6a851688a45eeaeb6e225e33ab3704364" as const;

export const PHASE1_PROVER_ABI = [
  { type: "function", name: "swap", inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "zeroForOne", type: "bool" },{ name: "amountSpecified", type: "int256" }], outputs: [{ name: "delta", type: "int256" }], stateMutability: "payable" },
  { type: "function", name: "addLiquidity", inputs: [{ name: "key", type: "tuple", components: [{ name: "currency0", type: "address" },{ name: "currency1", type: "address" },{ name: "fee", type: "uint24" },{ name: "tickSpacing", type: "int24" },{ name: "hooks", type: "address" }]},{ name: "tickLower", type: "int24" },{ name: "tickUpper", type: "int24" },{ name: "liquidityDelta", type: "int256" }], outputs: [{ name: "delta", type: "int256" }], stateMutability: "payable" },
] as const;
