// Lexifi deployed contract addresses

export const DEPLOYMENTS = {
  base: {
    chainId: 8453,
    hook: "0xb8ab80d89620c29E71563779111b9cb1d4d92880" as `0x${string}`,
    coinbaseProvider: "0x9Da4bDb53cA77e1788263771fA7459Fec098E1d7" as `0x${string}`,
    thresholdPolicy: "0x10741eab10b48d7B4b4f15cCD870255B853b2259" as `0x${string}`,
    regionalPolicy: "0x5568f3109B833AeBf107b2ffd665AF9C3931F029" as `0x${string}`,
    institutionalPolicy: "0x312089B3A28Bb8345F7B887d96E1e46Fed4efC30" as `0x${string}`,
    poolManager: "0x498581fF718922c3f8e6A244956aF099B2652b2b" as `0x${string}`,
    explorer: "https://basescan.org",
  },
  baseSepolia: {
    chainId: 84532,
    hook: "0x5b814ad56562a9Ee47776A382C6aF678B07aa880" as `0x${string}`,
    coinbaseProvider: "0xD40C35303FFF70E36A2Ea74fAC66de5D191bA6d8" as `0x${string}`,
    thresholdPolicy: "0xB2228cd33A2E4004c0e14fe9510E93df1d3aC2b2" as `0x${string}`,
    regionalPolicy: "" as `0x${string}`,
    institutionalPolicy: "0xe05d670802DF1a2FD0F5875439EFA40dfA1A5AEd" as `0x${string}`,
    poolManager: "0x05E73354cFDd6745C338b50BDB65F6c2F4163313" as `0x${string}`,
    explorer: "https://sepolia.basescan.org",
  },
} as const;

export function getDeployment(chainId: number) {
  if (chainId === 84532) return DEPLOYMENTS.baseSepolia;
  return DEPLOYMENTS.base;
}

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
