export interface LexifiDeployment {
  chainId: number;
  hook: `0x${string}`;
  coinbaseProvider: `0x${string}`;
  thresholdPolicy: `0x${string}`;
  regionalPolicy: `0x${string}`;
  institutionalPolicy: `0x${string}`;
  selfAttestationProvider: `0x${string}`;
  poolManager: `0x${string}`;
  explorer: string;
  blockscoutApi: string;
}

export const base: LexifiDeployment = {
  chainId: 8453,
  hook: "0xfE92DE69d2dDdcAc2f864C4cF84e8aD5E17D2880",
  coinbaseProvider: "0xb5DEC225A104A276671A765abA3890Ec88a2Ca27",
  thresholdPolicy: "0x75f4913F53b694fDda95E49456d163ca7AEF4199",
  regionalPolicy: "0xa99A89CD5A61e975fb11047d3ed455fCcaD9A44f",
  institutionalPolicy: "0xaD09fc63080736b1dFC4048F3589C481225db5fb",
  selfAttestationProvider: "0x344E4917360F5b44680D097c5E4904Ac62c00483",
  poolManager: "0x498581fF718922c3f8e6A244956aF099B2652b2b",
  explorer: "https://basescan.org",
  blockscoutApi: "https://base.blockscout.com/api/v2",
};

export const baseSepolia: LexifiDeployment = {
  chainId: 84532,
  hook: "0x5b814ad56562a9Ee47776A382C6aF678B07aa880",
  coinbaseProvider: "0xD40C35303FFF70E36A2Ea74fAC66de5D191bA6d8",
  thresholdPolicy: "0xB2228cd33A2E4004c0e14fe9510E93df1d3aC2b2",
  regionalPolicy: "0x0000000000000000000000000000000000000000",
  institutionalPolicy: "0xe05d670802DF1a2FD0F5875439EFA40dfA1A5AEd",
  selfAttestationProvider: "0x0000000000000000000000000000000000000000",
  poolManager: "0x05E73354cFDd6745C338b50BDB65F6c2F4163313",
  explorer: "https://sepolia.basescan.org",
  blockscoutApi: "https://base-sepolia.blockscout.com/api/v2",
};

export function getDeployment(chainId: number): LexifiDeployment {
  if (chainId === 84532) return baseSepolia;
  return base;
}
