// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IVerificationProvider {
    struct VerificationResult {
        bool verified;
        uint256 tier;
        uint256 expiry;
        bytes32 attestationId;
        string providerName;
    }

    function verify(address user) external view returns (VerificationResult memory result);
    function providerId() external view returns (bytes32);
    function providerName() external view returns (string memory);
    function supportsType(bytes32 verificationType) external view returns (bool);
}
