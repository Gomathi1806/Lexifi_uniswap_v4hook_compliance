import type { LexifiDeployment } from "./addresses.js";
import { type AuditRecord } from "./types.js";
export interface FetchAuditOptions {
    deployment: LexifiDeployment;
    routerAddresses: `0x${string}`[];
    fallbackPoolId?: string;
}
export declare function fetchAuditTrail(options: FetchAuditOptions): Promise<AuditRecord[]>;
//# sourceMappingURL=audit.d.ts.map