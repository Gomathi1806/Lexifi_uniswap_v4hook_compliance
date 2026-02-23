// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {MultiProviderComplianceHook} from "../src/MultiProviderComplianceHook.sol";
import {IEAS, Attestation} from "../src/interfaces/IEAS.sol";
import {IAttestationIndexer} from "../src/interfaces/IAttestationIndexer.sol";

// ═══════════════════════════════════════════
//              MOCK CONTRACTS
// ═══════════════════════════════════════════

contract MockEAS is IEAS {
    mapping(bytes32 => Attestation) public attestations;
    mapping(bytes32 => bool) public validAttestations;

    function setAttestation(bytes32 uid, Attestation memory att) external {
        attestations[uid] = att;
        validAttestations[uid] = true;
    }

    function revokeAttestation(bytes32 uid) external {
        attestations[uid].revocationTime = uint64(block.timestamp);
    }

    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        return attestations[uid];
    }

    function isAttestationValid(bytes32 uid) external view override returns (bool) {
        return validAttestations[uid] && attestations[uid].revocationTime == 0;
    }

    function getTimestamp(bytes32) external pure override returns (uint64) {
        return 0;
    }
}

contract MockIndexer is IAttestationIndexer {
    mapping(address => mapping(bytes32 => bytes32)) private _index;

    function setIndex(address recipient, bytes32 schema, bytes32 uid) external {
        _index[recipient][schema] = uid;
    }

    function getAttestationUid(address recipient, bytes32 schema) external view override returns (bytes32) {
        return _index[recipient][schema];
    }
}

// ═══════════════════════════════════════════
//              TEST CONTRACT
// ═══════════════════════════════════════════

contract MultiProviderComplianceHookTest is Test {
    using PoolIdLibrary for PoolKey;

    MultiProviderComplianceHook hook;
    MockEAS mockEAS;
    MockIndexer mockIndexer;

    // We use a fake PoolManager address — hook only checks msg.sender == poolManager
    address constant FAKE_POOL_MANAGER = address(0xPM);

    // Test addresses
    address public owner = address(this);
    address public verifiedUser = address(0x1111);
    address public unverifiedUser = address(0x2222);
    address public institutionalUser = address(0x3333);
    address public randomUser = address(0x4444);

    // Test schema IDs
    bytes32 constant COINBASE_ACCOUNT_SCHEMA = keccak256("coinbase.account.v1");
    bytes32 constant COINBASE_COUNTRY_SCHEMA = keccak256("coinbase.country.v1");
    bytes32 constant INSTITUTIONAL_SCHEMA = keccak256("institutional.kyc.v1");

    // Attestation UIDs
    bytes32 constant VERIFIED_USER_UID = keccak256("att.verified.user");
    bytes32 constant INSTITUTIONAL_USER_UID = keccak256("att.institutional.user");

    // Mock attester addresses
    address constant COINBASE_ATTESTER = address(0xCB01);
    address constant INSTITUTIONAL_ATTESTER = address(0x1234);

    // Test pool key
    PoolKey poolKey;

    function setUp() public {
        // Deploy mocks
        mockEAS = new MockEAS();
        mockIndexer = new MockIndexer();

        // Deploy hook (address doesn't need flag bits for unit testing)
        hook = new MultiProviderComplianceHook(
            IPoolManager(FAKE_POOL_MANAGER),
            address(mockEAS),
            address(mockIndexer)
        );

        // Create a test pool key
        poolKey = PoolKey({
            currency0: Currency.wrap(address(0xAAA)),
            currency1: Currency.wrap(address(0xBBB)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        // Add trusted schemas
        hook.addTrustedSchema(
            COINBASE_ACCOUNT_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );

        hook.addTrustedSchema(
            COINBASE_COUNTRY_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.ENHANCED,
            true
        );

        hook.addTrustedSchema(
            INSTITUTIONAL_SCHEMA,
            INSTITUTIONAL_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL,
            false
        );

        // Configure pool compliance
        hook.setPoolCompliance(
            poolKey,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            0 // no swap limit
        );

        // Create attestation for verified user (BASIC tier)
        _createAttestation(
            VERIFIED_USER_UID,
            COINBASE_ACCOUNT_SCHEMA,
            COINBASE_ATTESTER,
            verifiedUser
        );
        mockIndexer.setIndex(verifiedUser, COINBASE_ACCOUNT_SCHEMA, VERIFIED_USER_UID);

        // Create attestation for institutional user
        _createAttestation(
            INSTITUTIONAL_USER_UID,
            INSTITUTIONAL_SCHEMA,
            INSTITUTIONAL_ATTESTER,
            institutionalUser
        );
        mockIndexer.setIndex(institutionalUser, INSTITUTIONAL_SCHEMA, INSTITUTIONAL_USER_UID);
    }

    function _createAttestation(
        bytes32 uid,
        bytes32 schema,
        address attester,
        address recipient
    ) internal {
        Attestation memory att = Attestation({
            uid: uid,
            schema: schema,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            attester: attester,
            recipient: recipient,
            revocable: true,
            data: ""
        });
        mockEAS.setAttestation(uid, att);
    }

    // ═══════════════════════════════════════════
    //        COMPLIANCE TIER CHECKS
    // ═══════════════════════════════════════════

    function test_verifiedUserHasBasicTier() public view {
        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(verifiedUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.BASIC));
    }

    function test_unverifiedUserHasNoTier() public view {
        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(unverifiedUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.NONE));
    }

    function test_institutionalUserHasHighestTier() public view {
        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(institutionalUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL));
    }

    function test_manualOverrideTakesPriority() public {
        hook.setManualOverride(randomUser, MultiProviderComplianceHook.ComplianceTier.ENHANCED);
        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(randomUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.ENHANCED));
    }

    // ═══════════════════════════════════════════
    //           SCHEMA MANAGEMENT
    // ═══════════════════════════════════════════

    function test_addTrustedSchema() public {
        bytes32 newSchema = keccak256("new.schema.v1");
        hook.addTrustedSchema(
            newSchema,
            address(0x9999),
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
        assertEq(hook.getSchemaCount(), 4); // 3 from setUp + 1 new
    }

    function test_addDuplicateSchemaReverts() public {
        vm.expectRevert(MultiProviderComplianceHook.SchemaAlreadyExists.selector);
        hook.addTrustedSchema(
            COINBASE_ACCOUNT_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
    }

    function test_deactivateSchema() public {
        hook.deactivateSchema(COINBASE_ACCOUNT_SCHEMA);
        hook.invalidateCache(verifiedUser);
        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(verifiedUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.NONE));
    }

    function test_onlyOwnerCanAddSchema() public {
        vm.prank(randomUser);
        vm.expectRevert(MultiProviderComplianceHook.NotOwner.selector);
        hook.addTrustedSchema(
            keccak256("unauthorized"),
            address(0),
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
    }

    // ═══════════════════════════════════════════
    //           POOL COMPLIANCE
    // ═══════════════════════════════════════════

    function test_poolComplianceIsActive() public view {
        assertTrue(hook.isPoolCompliant(poolKey));
    }

    function test_disablePoolCompliance() public {
        hook.disablePoolCompliance(poolKey);
        assertFalse(hook.isPoolCompliant(poolKey));
    }

    // ═══════════════════════════════════════════
    //        ATTESTATION EDGE CASES
    // ═══════════════════════════════════════════

    function test_revokedAttestationFails() public {
        mockEAS.revokeAttestation(VERIFIED_USER_UID);
        hook.invalidateCache(verifiedUser);

        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(verifiedUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.NONE));
    }

    function test_expiredAttestationFails() public {
        bytes32 expiredUid = keccak256("expired.att");
        Attestation memory att = Attestation({
            uid: expiredUid,
            schema: COINBASE_ACCOUNT_SCHEMA,
            time: uint64(block.timestamp - 2 days),
            expirationTime: uint64(block.timestamp - 1 days), // expired yesterday
            revocationTime: 0,
            refUID: bytes32(0),
            attester: COINBASE_ATTESTER,
            recipient: randomUser,
            revocable: true,
            data: ""
        });
        mockEAS.setAttestation(expiredUid, att);
        mockIndexer.setIndex(randomUser, COINBASE_ACCOUNT_SCHEMA, expiredUid);

        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(randomUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.NONE));
    }

    function test_wrongAttesterFails() public {
        bytes32 wrongUid = keccak256("wrong.attester");
        Attestation memory att = Attestation({
            uid: wrongUid,
            schema: COINBASE_ACCOUNT_SCHEMA,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            attester: address(0xBAD), // Wrong attester!
            recipient: randomUser,
            revocable: true,
            data: ""
        });
        mockEAS.setAttestation(wrongUid, att);
        mockIndexer.setIndex(randomUser, COINBASE_ACCOUNT_SCHEMA, wrongUid);

        MultiProviderComplianceHook.ComplianceTier tier = hook.getComplianceTier(randomUser);
        assertEq(uint256(tier), uint256(MultiProviderComplianceHook.ComplianceTier.NONE));
    }

    // ═══════════════════════════════════════════
    //        BEFORESWAP HOOK TESTS
    // ═══════════════════════════════════════════

    function test_beforeSwap_allowsVerifiedUser() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });

        bytes memory hookData = abi.encode(verifiedUser);

        // Call from pool manager
        vm.prank(FAKE_POOL_MANAGER);
        (bytes4 selector,,) = hook.beforeSwap(address(0), poolKey, params, hookData);
        assertEq(selector, IHooks.beforeSwap.selector);
    }

    function test_beforeSwap_blocksUnverifiedUser() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });

        bytes memory hookData = abi.encode(unverifiedUser);

        vm.prank(FAKE_POOL_MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiProviderComplianceHook.InsufficientCompliance.selector,
                unverifiedUser,
                MultiProviderComplianceHook.ComplianceTier.BASIC,
                MultiProviderComplianceHook.ComplianceTier.NONE
            )
        );
        hook.beforeSwap(address(0), poolKey, params, hookData);
    }

    function test_beforeSwap_revertsIfNotPoolManager() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });

        // Call from non-pool-manager address
        vm.prank(randomUser);
        vm.expectRevert(MultiProviderComplianceHook.NotPoolManager.selector);
        hook.beforeSwap(address(0), poolKey, params, "");
    }

    function test_beforeSwap_allowsAnyoneWhenComplianceDisabled() public {
        hook.disablePoolCompliance(poolKey);

        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });

        bytes memory hookData = abi.encode(unverifiedUser);

        vm.prank(FAKE_POOL_MANAGER);
        (bytes4 selector,,) = hook.beforeSwap(address(0), poolKey, params, hookData);
        assertEq(selector, IHooks.beforeSwap.selector);
    }

    // ═══════════════════════════════════════════
    //        SWAP AMOUNT LIMIT TESTS
    // ═══════════════════════════════════════════

    function test_beforeSwap_enforcesMaxSwapAmount() public {
        // Set a swap limit of 100 tokens
        hook.setPoolCompliance(
            poolKey,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            100e18
        );

        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 200e18, // Exceeds limit
            sqrtPriceLimitX96: 0
        });

        bytes memory hookData = abi.encode(verifiedUser);

        vm.prank(FAKE_POOL_MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiProviderComplianceHook.SwapExceedsLimit.selector,
                200e18,
                100e18
            )
        );
        hook.beforeSwap(address(0), poolKey, params, hookData);
    }

    function test_beforeSwap_allowsWithinSwapLimit() public {
        hook.setPoolCompliance(
            poolKey,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            100e18
        );

        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 50e18, // Within limit
            sqrtPriceLimitX96: 0
        });

        bytes memory hookData = abi.encode(verifiedUser);

        vm.prank(FAKE_POOL_MANAGER);
        (bytes4 selector,,) = hook.beforeSwap(address(0), poolKey, params, hookData);
        assertEq(selector, IHooks.beforeSwap.selector);
    }

    // ═══════════════════════════════════════════
    //        BATCH + OWNERSHIP TESTS
    // ═══════════════════════════════════════════

    function test_batchSetManualOverrides() public {
        address[] memory users = new address[](3);
        users[0] = address(0xA001);
        users[1] = address(0xA002);
        users[2] = address(0xA003);

        hook.batchSetManualOverrides(users, MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL);

        for (uint256 i = 0; i < users.length; i++) {
            assertEq(
                uint256(hook.getComplianceTier(users[i])),
                uint256(MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL)
            );
        }
    }

    function test_transferOwnership() public {
        address newOwner = address(0x9999);
        hook.transferOwnership(newOwner);
        assertEq(hook.owner(), newOwner);

        // Old owner can no longer call admin functions
        vm.expectRevert(MultiProviderComplianceHook.NotOwner.selector);
        hook.addTrustedSchema(
            keccak256("should.fail"),
            address(0),
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
    }

    // ═══════════════════════════════════════════
    //              CACHE TESTS
    // ═══════════════════════════════════════════

    function test_cacheInvalidation() public {
        // Trigger a compliance check to populate cache (need to call via beforeSwap from PM)
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });
        bytes memory hookData = abi.encode(verifiedUser);
        vm.prank(FAKE_POOL_MANAGER);
        hook.beforeSwap(address(0), poolKey, params, hookData);

        // Invalidate
        hook.invalidateCache(verifiedUser);
        (MultiProviderComplianceHook.ComplianceTier cached) = hook.complianceCache(verifiedUser);
        assertEq(uint256(cached), uint256(MultiProviderComplianceHook.ComplianceTier.NONE));
    }

    function test_cacheDurationUpdate() public {
        hook.setCacheDuration(2 days);
        assertEq(hook.cacheDuration(), 2 days);
    }
}
