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
export declare const base: LexifiDeployment;
export declare const baseSepolia: LexifiDeployment;
export declare function getDeployment(chainId: number): LexifiDeployment;
//# sourceMappingURL=addresses.d.ts.map