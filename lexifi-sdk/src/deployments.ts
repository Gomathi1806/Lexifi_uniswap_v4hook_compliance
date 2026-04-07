import { LexifiDeployment } from "./types";

export const deployments: Record<number, LexifiDeployment> = {
  8453: {
    chainId: 8453,
    chainName: "Base",
    contracts: {
      multiProviderComplianceHook: "0x607c0334cb4d00CdE6fB6dfcf35E4D2a98865BFb",
      zkPassProvider: "0x929E5aB25B8E5F37c85dF59792FB24aDe61Cb646",
      eas: "0x4200000000000000000000000000000000000021"
    }
  }
};

export function getDeployment(chainId: number): LexifiDeployment | undefined {
  return deployments[chainId];
}
