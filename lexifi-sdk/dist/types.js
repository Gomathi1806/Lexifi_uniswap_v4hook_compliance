export var AccessLevel;
(function (AccessLevel) {
    AccessLevel[AccessLevel["DENIED"] = 0] = "DENIED";
    AccessLevel[AccessLevel["RETAIL"] = 1] = "RETAIL";
    AccessLevel[AccessLevel["ACCREDITED"] = 2] = "ACCREDITED";
    AccessLevel[AccessLevel["INSTITUTIONAL"] = 3] = "INSTITUTIONAL";
})(AccessLevel || (AccessLevel = {}));
export const AccessLevelLabels = {
    [AccessLevel.DENIED]: "No Access",
    [AccessLevel.RETAIL]: "Basic KYC",
    [AccessLevel.ACCREDITED]: "Enhanced",
    [AccessLevel.INSTITUTIONAL]: "Institutional",
};
export var Operation;
(function (Operation) {
    Operation[Operation["SWAP"] = 0] = "SWAP";
    Operation[Operation["ADD_LIQUIDITY"] = 1] = "ADD_LIQUIDITY";
    Operation[Operation["REMOVE_LIQUIDITY"] = 2] = "REMOVE_LIQUIDITY";
})(Operation || (Operation = {}));
//# sourceMappingURL=types.js.map