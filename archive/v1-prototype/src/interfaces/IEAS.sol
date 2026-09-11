// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IEAS - Interface for Ethereum Attestation Service
/// @notice EAS is a predeploy on OP Stack chains (Base) at 0x4200000000000000000000000000000000000021
struct Attestation {
    bytes32 uid;
    bytes32 schema;
    uint64 time;
    uint64 expirationTime;
    uint64 revocationTime;
    bytes32 refUID;
    address recipient;
    address attester;
    bool revocable;
    bytes data;
}

interface IEAS {
    function getAttestation(
        bytes32 uid
    ) external view returns (Attestation memory);

    function isAttestationValid(bytes32 uid) external view returns (bool);

    function getTimestamp(bytes32 data) external view returns (uint64);
}
