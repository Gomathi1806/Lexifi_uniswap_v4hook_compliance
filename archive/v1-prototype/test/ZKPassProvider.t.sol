// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {ZKPassProvider} from "../src/providers/ZKPassProvider.sol";
import {IVerificationProvider} from "../src/interfaces/IVerificationProvider.sol";

contract ZKPassProviderTest is Test {
    ZKPassProvider public provider;

    // Test attester key pair (generated for testing only)
    uint256 constant ATTESTER_PK = 0xA11CE;
    address attester;

    address owner = address(0xAD);
    address user1 = address(0x1);
    address user2 = address(0x2);
    address user3 = address(0x3);

    // Schema IDs (simulating zkPass Schema Market entries)
    bytes32 constant SCHEMA_KYC = keccak256("kyc-passport-verification");
    bytes32 constant SCHEMA_ACCREDITED = keccak256("accredited-investor-proof");
    bytes32 constant SCHEMA_BUSINESS = keccak256("business-registration-proof");

    function setUp() public {
        attester = vm.addr(ATTESTER_PK);
        provider = new ZKPassProvider(attester, owner);

        // Configure schemas
        vm.startPrank(owner);
        provider.configureSchema(SCHEMA_KYC, 1, "Passport KYC verification via zkPass");
        provider.configureSchema(SCHEMA_ACCREDITED, 2, "Accredited investor ZK proof");
        provider.configureSchema(SCHEMA_BUSINESS, 3, "Business registration ZK proof");
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════

    function _makeProof(
        address recipient,
        bytes32 schemaId,
        bytes32 taskId
    ) internal view returns (ZKPassProvider.ZKProof memory) {
        bytes32 uHash = keccak256(abi.encodePacked("user-identity-hash", recipient));
        bytes32 publicFieldsHash = keccak256(abi.encodePacked("public-fields", schemaId));

        // Compute message hash (same as contract)
        bytes32 messageHash = keccak256(abi.encodePacked(
            taskId, schemaId, uHash, publicFieldsHash, recipient
        ));

        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));

        // Sign with attester key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ATTESTER_PK, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        return ZKPassProvider.ZKProof({
            taskId: taskId,
            schemaId: schemaId,
            uHash: uHash,
            publicFieldsHash: publicFieldsHash,
            recipient: recipient,
            signature: signature
        });
    }

    // ═══════════════════════════════════════════
    //  PROVIDER METADATA
    // ═══════════════════════════════════════════

    function test_ProviderName() public view {
        assertEq(provider.providerName(), "zkPass TransGate (Zero-Knowledge)");
    }

    function test_ProviderId() public view {
        assertEq(provider.providerId(), keccak256("zkpass-transgate"));
    }

    function test_SupportsTypes() public view {
        assertTrue(provider.supportsType(keccak256("KYC")));
        assertTrue(provider.supportsType(keccak256("ACCREDITED")));
        assertTrue(provider.supportsType(keccak256("BUSINESS")));
        assertFalse(provider.supportsType(keccak256("RANDOM")));
    }

    // ═══════════════════════════════════════════
    //  PROOF SUBMISSION — KYC (TIER 1)
    // ═══════════════════════════════════════════

    function test_SubmitKYCProof_GrantsRetailTier() public {
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));

        provider.submitProof(proof);

        assertTrue(provider.isVerified(user1));
        assertEq(provider.getUserTier(user1), 1);
    }

    function test_SubmitKYCProof_VerifyReturnsCorrectResult() public {
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));
        provider.submitProof(proof);

        IVerificationProvider.VerificationResult memory result = provider.verify(user1);

        assertTrue(result.verified);
        assertEq(result.tier, 1);
        assertEq(result.providerName, "zkpass");
        assertTrue(result.attestationId != bytes32(0));
    }

    // ═══════════════════════════════════════════
    //  PROOF SUBMISSION — ACCREDITED (TIER 2)
    // ═══════════════════════════════════════════

    function test_SubmitAccreditedProof_GrantsAccreditedTier() public {
        ZKPassProvider.ZKProof memory proof = _makeProof(user2, SCHEMA_ACCREDITED, bytes32(uint256(2)));

        provider.submitProof(proof);

        assertTrue(provider.isVerified(user2));
        assertEq(provider.getUserTier(user2), 2);
    }

    // ═══════════════════════════════════════════
    //  PROOF SUBMISSION — BUSINESS (TIER 3)
    // ═══════════════════════════════════════════

    function test_SubmitBusinessProof_GrantsInstitutionalTier() public {
        ZKPassProvider.ZKProof memory proof = _makeProof(user3, SCHEMA_BUSINESS, bytes32(uint256(3)));

        provider.submitProof(proof);

        assertTrue(provider.isVerified(user3));
        assertEq(provider.getUserTier(user3), 3);
    }

    // ═══════════════════════════════════════════
    //  TIER UPGRADE (NEVER DOWNGRADE)
    // ═══════════════════════════════════════════

    function test_TierUpgrade_KYCThenAccredited() public {
        // First: KYC proof → tier 1
        ZKPassProvider.ZKProof memory proof1 = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(10)));
        provider.submitProof(proof1);
        assertEq(provider.getUserTier(user1), 1);

        // Second: Accredited proof → tier 2
        ZKPassProvider.ZKProof memory proof2 = _makeProof(user1, SCHEMA_ACCREDITED, bytes32(uint256(11)));
        provider.submitProof(proof2);
        assertEq(provider.getUserTier(user1), 2);
    }

    function test_TierNeverDowngrades() public {
        // First: Accredited proof → tier 2
        ZKPassProvider.ZKProof memory proof1 = _makeProof(user1, SCHEMA_ACCREDITED, bytes32(uint256(20)));
        provider.submitProof(proof1);
        assertEq(provider.getUserTier(user1), 2);

        // Second: KYC proof → tier 1 (should NOT downgrade)
        ZKPassProvider.ZKProof memory proof2 = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(21)));
        provider.submitProof(proof2);
        assertEq(provider.getUserTier(user1), 2); // Still 2, not downgraded
    }

    // ═══════════════════════════════════════════
    //  REPLAY PROTECTION
    // ═══════════════════════════════════════════

    function test_ReplayProof_Reverts() public {
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));

        provider.submitProof(proof);

        // Same proof again — should revert
        vm.expectRevert();
        provider.submitProof(proof);
    }

    // ═══════════════════════════════════════════
    //  INVALID SIGNATURE
    // ═══════════════════════════════════════════

    function test_InvalidSignature_Reverts() public {
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));

        // Tamper with the signature
        proof.signature[0] = proof.signature[0] ^ 0xFF;

        vm.expectRevert();
        provider.submitProof(proof);
    }

    function test_WrongAttester_Reverts() public {
        // Create proof signed by wrong key
        uint256 wrongPK = 0xBEEF;
        bytes32 taskId = bytes32(uint256(100));
        bytes32 uHash = keccak256(abi.encodePacked("user-identity-hash", user1));
        bytes32 publicFieldsHash = keccak256(abi.encodePacked("public-fields", SCHEMA_KYC));

        bytes32 messageHash = keccak256(abi.encodePacked(
            taskId, SCHEMA_KYC, uHash, publicFieldsHash, user1
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPK, ethSignedHash);

        ZKPassProvider.ZKProof memory proof = ZKPassProvider.ZKProof({
            taskId: taskId,
            schemaId: SCHEMA_KYC,
            uHash: uHash,
            publicFieldsHash: publicFieldsHash,
            recipient: user1,
            signature: abi.encodePacked(r, s, v)
        });

        vm.expectRevert(ZKPassProvider.InvalidSignature.selector);
        provider.submitProof(proof);
    }

    // ═══════════════════════════════════════════
    //  SCHEMA NOT ACCEPTED
    // ═══════════════════════════════════════════

    function test_UnacceptedSchema_Reverts() public {
        bytes32 badSchema = keccak256("random-unaccepted-schema");
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, badSchema, bytes32(uint256(1)));

        vm.expectRevert(abi.encodeWithSelector(ZKPassProvider.SchemaNotAccepted.selector, badSchema));
        provider.submitProof(proof);
    }

    // ═══════════════════════════════════════════
    //  UNVERIFIED USER
    // ═══════════════════════════════════════════

    function test_UnverifiedUser_ReturnsDenied() public view {
        IVerificationProvider.VerificationResult memory result = provider.verify(user1);

        assertFalse(result.verified);
        assertEq(result.tier, 0);
    }

    // ═══════════════════════════════════════════
    //  SCHEMA CONFIGURATION
    // ═══════════════════════════════════════════

    function test_ConfigureSchema_OnlyOwner() public {
        vm.prank(address(0xBAD));
        vm.expectRevert(ZKPassProvider.OnlyOwner.selector);
        provider.configureSchema(bytes32(uint256(999)), 1, "bad");
    }

    function test_RemoveSchema() public {
        vm.prank(owner);
        provider.removeSchema(SCHEMA_KYC);

        assertFalse(provider.acceptedSchemas(SCHEMA_KYC));

        // Now submitting a proof with removed schema fails
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));
        vm.expectRevert(abi.encodeWithSelector(ZKPassProvider.SchemaNotAccepted.selector, SCHEMA_KYC));
        provider.submitProof(proof);
    }

    // ═══════════════════════════════════════════
    //  REVOCATION
    // ═══════════════════════════════════════════

    function test_RevokeUser() public {
        // First verify
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));
        provider.submitProof(proof);
        assertTrue(provider.isVerified(user1));

        // Revoke
        vm.prank(owner);
        provider.revokeUser(user1, "Fraud detected");

        assertFalse(provider.isVerified(user1));
        assertEq(provider.getUserTier(user1), 0);
    }

    function test_RevokeUser_OnlyOwner() public {
        vm.prank(address(0xBAD));
        vm.expectRevert(ZKPassProvider.OnlyOwner.selector);
        provider.revokeUser(user1, "nope");
    }

    // ═══════════════════════════════════════════
    //  ANALYTICS
    // ═══════════════════════════════════════════

    function test_TotalVerifications_Increments() public {
        assertEq(provider.totalVerifications(), 0);

        ZKPassProvider.ZKProof memory proof1 = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));
        provider.submitProof(proof1);
        assertEq(provider.totalVerifications(), 1);

        ZKPassProvider.ZKProof memory proof2 = _makeProof(user2, SCHEMA_ACCREDITED, bytes32(uint256(2)));
        provider.submitProof(proof2);
        assertEq(provider.totalVerifications(), 2);
    }

    // ═══════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════

    function test_EmitsProofVerified() public {
        ZKPassProvider.ZKProof memory proof = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(1)));

        vm.expectEmit(true, true, false, false);
        emit ZKPassProvider.ProofVerified(user1, SCHEMA_KYC, 1, bytes32(0), 0);

        provider.submitProof(proof);
    }

    function test_EmitsSchemaConfigured() public {
        bytes32 newSchema = keccak256("new-schema");

        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit ZKPassProvider.SchemaConfigured(newSchema, 2, "");

        provider.configureSchema(newSchema, 2, "New schema");
    }

    // ═══════════════════════════════════════════
    //  OWNERSHIP
    // ═══════════════════════════════════════════

    function test_TransferOwnership() public {
        address newOwner = address(0xCCC);

        vm.prank(owner);
        provider.transferOwnership(newOwner);

        assertEq(provider.owner(), newOwner);

        // Old owner can't act
        vm.prank(owner);
        vm.expectRevert(ZKPassProvider.OnlyOwner.selector);
        provider.configureSchema(bytes32(0), 1, "fail");
    }

    // ═══════════════════════════════════════════
    //  MULTIPLE USERS
    // ═══════════════════════════════════════════

    function test_MultipleUsers_IndependentVerification() public {
        // User 1: KYC (tier 1)
        ZKPassProvider.ZKProof memory p1 = _makeProof(user1, SCHEMA_KYC, bytes32(uint256(50)));
        provider.submitProof(p1);

        // User 2: Accredited (tier 2)
        ZKPassProvider.ZKProof memory p2 = _makeProof(user2, SCHEMA_ACCREDITED, bytes32(uint256(51)));
        provider.submitProof(p2);

        // User 3: Business (tier 3)
        ZKPassProvider.ZKProof memory p3 = _makeProof(user3, SCHEMA_BUSINESS, bytes32(uint256(52)));
        provider.submitProof(p3);

        assertEq(provider.getUserTier(user1), 1);
        assertEq(provider.getUserTier(user2), 2);
        assertEq(provider.getUserTier(user3), 3);

        assertEq(provider.totalVerifications(), 3);
    }
}
