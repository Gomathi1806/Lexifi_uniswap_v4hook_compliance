export interface LexifiDeployment {
  chainId: number;
  chainName: string;
  contracts: {
    multiProviderComplianceHook: `0x${string}`;
    zkPassProvider: `0x${string}`;
    // The main EAS contract address on this chain
    eas?: `0x${string}`;
  };
}
