// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IAttestationIndexer - Coinbase attestation indexer on Base
/// @notice Maps (recipient, schema) → attestation UID for efficient lookup
interface IAttestationIndexer {
    function getAttestationUid(address recipient, bytes32 schema) external view returns (bytes32);
}
