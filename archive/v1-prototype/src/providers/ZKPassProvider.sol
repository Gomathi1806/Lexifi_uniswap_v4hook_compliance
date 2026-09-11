// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IVerificationProvider} from "../interfaces/IVerificationProvider.sol";

/// @title ZKPassProvider
/// @notice Verification provider that verifies zkPass TransGate zero-knowledge proofs on-chain.
/// @dev Flow:
///   1. User generates a ZK proof via zkPass TransGate browser extension
///      (proves identity from any HTTPS website without revealing raw data)
///   2. User or relayer calls submitProof() with the proof data
///   3. Contract verifies the proof signature against zkPass's attester
///   4. Stores verified status: user → tier mapping
///   5. Lexifi policies call verify() to read the stored tier
///
///   Privacy: The user's actual identity data (passport, bank account, etc.)
///   is NEVER submitted on-chain. Only the ZK proof is submitted, which proves
///   the user meets certain criteria without revealing what those criteria are.
///
///   Schema mapping:
///   - KYC schema (e.g. passport verification) → Tier 1 (RETAIL)
///   - Accredited investor schema → Tier 2 (ACCREDITED)
///   - Institution/business schema → Tier 3 (INSTITUTIONAL)
contract ZKPassProvider is IVerificationProvider {
    // ═══════════════════════════════════════════
    //  TYPES
    // ═══════════════════════════════════════════

    struct ZKProof {
        bytes32 taskId;           // Unique task ID from TransGate
        bytes32 schemaId;         // Which zkPass schema was used
        bytes32 uHash;            // Hash of user's identity data
        bytes32 publicFieldsHash; // Hash of public fields
        address recipient;        // Wallet address the proof is bound to
        bytes signature;          // ECDSA signature from zkPass attester
    }

    struct VerifiedUser {
        bool verified;
        uint256 tier;
        uint256 timestamp;        // When proof was submitted
        bytes32 proofHash;        // Hash of the proof for audit trail
        bytes32 schemaId;         // Which schema was verified
    }

    // ═══════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════

    /// @notice zkPass attester address (verifies proof signatures)
    address public immutable zkPassAttester;

    /// @notice Contract owner
    address public owner;

    /// @notice Verified users: wallet → verification data
    mapping(address => VerifiedUser) public verifiedUsers;

    /// @notice Schema → tier mapping (configurable by owner)
    /// e.g. keccak256("kyc-passport") → 1 (RETAIL)
    mapping(bytes32 => uint256) public schemaTier;

    /// @notice Whether a schema is accepted
    mapping(bytes32 => bool) public acceptedSchemas;

    /// @notice Proof hash → used (prevents replay)
    mapping(bytes32 => bool) public usedProofs;

    /// @notice Total verifications performed
    uint256 public totalVerifications;

    // ═══════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════

    event ProofVerified(
        address indexed user,
        bytes32 indexed schemaId,
        uint256 tier,
        bytes32 proofHash,
        uint256 timestamp
    );

    event SchemaConfigured(
        bytes32 indexed schemaId,
        uint256 tier,
        string description
    );

    event ProofRevoked(address indexed user, string reason);

    // ═══════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════

    error InvalidSignature();
    error SchemaNotAccepted(bytes32 schemaId);
    error ProofAlreadyUsed(bytes32 proofHash);
    error RecipientMismatch(address expected, address actual);
    error OnlyOwner();
    error ProofExpired();

    // ═══════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════

    /// @param _zkPassAttester The zkPass attester address that signs proofs
    /// @param _owner Contract owner for configuration
    constructor(address _zkPassAttester, address _owner) {
        zkPassAttester = _zkPassAttester;
        owner = _owner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ═══════════════════════════════════════════
    //  PROOF SUBMISSION & VERIFICATION
    // ═══════════════════════════════════════════

    /// @notice Submit and verify a zkPass TransGate proof
    /// @dev Anyone can submit a proof (user themselves or a relayer)
    /// @param proof The ZK proof data from TransGate
    function submitProof(ZKProof calldata proof) external {
        // 1. Check schema is accepted
        if (!acceptedSchemas[proof.schemaId]) {
            revert SchemaNotAccepted(proof.schemaId);
        }

        // 2. Compute proof hash (for replay protection + audit trail)
        bytes32 proofHash = keccak256(abi.encodePacked(
            proof.taskId,
            proof.schemaId,
            proof.uHash,
            proof.publicFieldsHash,
            proof.recipient
        ));

        // 3. Check proof hasn't been used before
        if (usedProofs[proofHash]) {
            revert ProofAlreadyUsed(proofHash);
        }

        // 4. Verify the signature from zkPass attester
        // The attester signs: keccak256(taskId, schemaId, uHash, publicFieldsHash, [recipient])
        bytes32 messageHash;
        if (proof.recipient != address(0)) {
            messageHash = keccak256(abi.encodePacked(
                proof.taskId,
                proof.schemaId,
                proof.uHash,
                proof.publicFieldsHash,
                proof.recipient
            ));
        } else {
            messageHash = keccak256(abi.encodePacked(
                proof.taskId,
                proof.schemaId,
                proof.uHash,
                proof.publicFieldsHash
            ));
        }

        // Ethereum signed message prefix
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));

        address signer = _recoverSigner(ethSignedHash, proof.signature);
        if (signer != zkPassAttester) {
            revert InvalidSignature();
        }

        // 5. Determine recipient (who this proof is for)
        address user = proof.recipient != address(0) ? proof.recipient : msg.sender;

        // 6. Get tier from schema mapping
        uint256 tier = schemaTier[proof.schemaId];

        // 7. Store verification (overwrites previous — latest proof wins)
        // Only upgrade tier, never downgrade
        if (tier > verifiedUsers[user].tier) {
            verifiedUsers[user] = VerifiedUser({
                verified: true,
                tier: tier,
                timestamp: block.timestamp,
                proofHash: proofHash,
                schemaId: proof.schemaId
            });
        }

        // 8. Mark proof as used
        usedProofs[proofHash] = true;
        totalVerifications++;

        emit ProofVerified(user, proof.schemaId, tier, proofHash, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //  IVerificationProvider
    // ═══════════════════════════════════════════

    /// @notice Check a user's ZK verification status
    function verify(address user) external view override returns (VerificationResult memory result) {
        VerifiedUser memory v = verifiedUsers[user];
        result.verified = v.verified;
        result.tier = v.tier;
        result.expiry = 0; // ZK proofs don't expire (revocation handled separately)
        result.attestationId = v.proofHash;
        result.providerName = "zkpass";
        return result;
    }

    function providerId() external pure override returns (bytes32) {
        return keccak256("zkpass-transgate");
    }

    function providerName() external pure override returns (string memory) {
        return "zkPass TransGate (Zero-Knowledge)";
    }

    function supportsType(bytes32 verificationType) external pure override returns (bool) {
        bytes32 KYC = keccak256("KYC");
        bytes32 ACCREDITED = keccak256("ACCREDITED");
        bytes32 BUSINESS = keccak256("BUSINESS");
        return verificationType == KYC
            || verificationType == ACCREDITED
            || verificationType == BUSINESS;
    }

    // ═══════════════════════════════════════════
    //  OWNER: SCHEMA CONFIGURATION
    // ═══════════════════════════════════════════

    /// @notice Configure a zkPass schema and its corresponding tier
    /// @param schemaId The zkPass schema ID (from zkPass Schema Market)
    /// @param tier The Lexifi tier this schema grants (1=RETAIL, 2=ACCREDITED, 3=INSTITUTIONAL)
    /// @param description Human-readable description for events
    function configureSchema(
        bytes32 schemaId,
        uint256 tier,
        string calldata description
    ) external onlyOwner {
        require(tier >= 1 && tier <= 3, "Tier must be 1-3");
        schemaTier[schemaId] = tier;
        acceptedSchemas[schemaId] = true;
        emit SchemaConfigured(schemaId, tier, description);
    }

    /// @notice Remove a schema from accepted list
    function removeSchema(bytes32 schemaId) external onlyOwner {
        acceptedSchemas[schemaId] = false;
        schemaTier[schemaId] = 0;
    }

    /// @notice Revoke a user's verification (e.g. if fraud detected)
    function revokeUser(address user, string calldata reason) external onlyOwner {
        delete verifiedUsers[user];
        emit ProofRevoked(user, reason);
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ═══════════════════════════════════════════
    //  VIEW HELPERS
    // ═══════════════════════════════════════════

    /// @notice Check if a user has a verified ZK proof
    function isVerified(address user) external view returns (bool) {
        return verifiedUsers[user].verified;
    }

    /// @notice Get user's verification tier
    function getUserTier(address user) external view returns (uint256) {
        return verifiedUsers[user].tier;
    }

    /// @notice Get full verification details
    function getVerification(address user) external view returns (VerifiedUser memory) {
        return verifiedUsers[user];
    }

    // ═══════════════════════════════════════════
    //  INTERNAL: ECDSA RECOVERY
    // ═══════════════════════════════════════════

    function _recoverSigner(bytes32 hash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature v");

        return ecrecover(hash, v, r, s);
    }
}
