export {
  base,
  baseSepolia,
  getDeployment,
  type LexifiDeployment,
  ConfigFamily,
  encodeRegionalConfig,
  encodeInstitutionalConfig,
} from "@lexifi/sdk";

export const TIERS = [
  { name: "DENIED", color: "#64748b", label: "No Access" },
  { name: "RETAIL", color: "#22d3ee", label: "Basic KYC" },
  { name: "ACCREDITED", color: "#a78bfa", label: "Enhanced" },
  { name: "INSTITUTIONAL", color: "#fbbf24", label: "Institutional" },
] as const;

export const POLICIES = [
  { key: "threshold", name: "Threshold Policy", desc: "Amount-based: no KYC below limit, basic above, enhanced for large trades" },
  { key: "regional", name: "Regional Policy", desc: "Geographic: requires country attestation for regulated pools" },
  { key: "institutional", name: "Institutional Policy", desc: "Multi-provider: N-of-M verification from multiple providers" },
] as const;

export const PHASE1 = {
  prover: "0xe7312b5A058fF42C269922BFCe1CB6B19bAcE35B" as `0x${string}`,
  testToken: "0x3FC84d416A0F93578dB538737c34599138012402" as `0x${string}`,
  poolId: "0x49081a9762db094a03e395f3d38272a16b69c753c904d7e4dfd16bd09a47a718",
} as const;
