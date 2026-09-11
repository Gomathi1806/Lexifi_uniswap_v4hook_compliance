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

    function getAttestation(
        bytes32 uid
    ) external view override returns (Attestation memory) {
        return attestations[uid];
    }

    function isAttestationValid(
        bytes32 uid
    ) external view override returns (bool) {
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

    function getAttestationUid(
        address recipient,
        bytes32 schema
    ) external view override returns (bytes32) {
        return _index[recipient][schema];
    }
}

contract MultiProviderComplianceHookTest is Test {
    using PoolIdLibrary for PoolKey;

    MultiProviderComplianceHook hook;
    MockEAS mockEAS;
    MockIndexer mockIndexer;

    address constant FAKE_POOL_MANAGER = address(0xABCD);

    address public verifiedUser = address(0x1111);
    address public unverifiedUser = address(0x2222);
    address public institutionalUser = address(0x3333);
    address public randomUser = address(0x4444);

    bytes32 constant COINBASE_ACCOUNT_SCHEMA = keccak256("coinbase.account.v1");
    bytes32 constant COINBASE_COUNTRY_SCHEMA = keccak256("coinbase.country.v1");
    bytes32 constant INSTITUTIONAL_SCHEMA = keccak256("institutional.kyc.v1");

    bytes32 constant VERIFIED_USER_UID = keccak256("att.verified.user");
    bytes32 constant INSTITUTIONAL_USER_UID =
        keccak256("att.institutional.user");

    address constant COINBASE_ATTESTER = address(0xCB01);
    address constant INSTITUTIONAL_ATTESTER = address(0x1234);

    PoolKey poolKey;

    function setUp() public {
        vm.startPrank(address(this), address(this));

        mockEAS = new MockEAS();
        mockIndexer = new MockIndexer();

        hook = new MultiProviderComplianceHook(
            IPoolManager(FAKE_POOL_MANAGER),
            address(mockEAS),
            address(mockIndexer)
        );

        poolKey = PoolKey({
            currency0: Currency.wrap(address(0xAAA)),
            currency1: Currency.wrap(address(0xBBB)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

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

        hook.setPoolCompliance(
            poolKey,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            0
        );

        _createAttestation(
            VERIFIED_USER_UID,
            COINBASE_ACCOUNT_SCHEMA,
            COINBASE_ATTESTER,
            verifiedUser
        );
        mockIndexer.setIndex(
            verifiedUser,
            COINBASE_ACCOUNT_SCHEMA,
            VERIFIED_USER_UID
        );

        _createAttestation(
            INSTITUTIONAL_USER_UID,
            INSTITUTIONAL_SCHEMA,
            INSTITUTIONAL_ATTESTER,
            institutionalUser
        );
        mockIndexer.setIndex(
            institutionalUser,
            INSTITUTIONAL_SCHEMA,
            INSTITUTIONAL_USER_UID
        );

        vm.stopPrank();
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

    function test_verifiedUserHasBasicTier() public view {
        assertEq(
            uint256(hook.getComplianceTier(verifiedUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.BASIC)
        );
    }

    function test_unverifiedUserHasNoTier() public view {
        assertEq(
            uint256(hook.getComplianceTier(unverifiedUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.NONE)
        );
    }

    function test_institutionalUserHasHighestTier() public view {
        assertEq(
            uint256(hook.getComplianceTier(institutionalUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL)
        );
    }

    function test_manualOverrideTakesPriority() public {
        hook.setManualOverride(
            randomUser,
            MultiProviderComplianceHook.ComplianceTier.ENHANCED
        );
        assertEq(
            uint256(hook.getComplianceTier(randomUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.ENHANCED)
        );
    }

    function test_addTrustedSchema() public {
        hook.addTrustedSchema(
            keccak256("new.schema.v1"),
            address(0x9999),
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
        assertEq(hook.getSchemaCount(), 4);
    }

    function test_addDuplicateSchemaReverts() public {
        vm.expectRevert(
            MultiProviderComplianceHook.SchemaAlreadyExists.selector
        );
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
        assertEq(
            uint256(hook.getComplianceTier(verifiedUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.NONE)
        );
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

    function test_poolComplianceIsActive() public view {
        assertTrue(hook.isPoolCompliant(poolKey));
    }

    function test_disablePoolCompliance() public {
        hook.disablePoolCompliance(poolKey);
        assertFalse(hook.isPoolCompliant(poolKey));
    }

    function test_revokedAttestationFails() public {
        mockEAS.revokeAttestation(VERIFIED_USER_UID);
        hook.invalidateCache(verifiedUser);
        assertEq(
            uint256(hook.getComplianceTier(verifiedUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.NONE)
        );
    }

    function test_expiredAttestationFails() public {
        vm.warp(10 days);
        bytes32 expiredUid = keccak256("expired.att");
        Attestation memory att = Attestation({
            uid: expiredUid,
            schema: COINBASE_ACCOUNT_SCHEMA,
            time: uint64(block.timestamp - 2 days),
            expirationTime: uint64(block.timestamp - 1 days),
            revocationTime: 0,
            refUID: bytes32(0),
            attester: COINBASE_ATTESTER,
            recipient: randomUser,
            revocable: true,
            data: ""
        });
        mockEAS.setAttestation(expiredUid, att);
        mockIndexer.setIndex(randomUser, COINBASE_ACCOUNT_SCHEMA, expiredUid);
        assertEq(
            uint256(hook.getComplianceTier(randomUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.NONE)
        );
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
            attester: address(0xBAD),
            recipient: randomUser,
            revocable: true,
            data: ""
        });
        mockEAS.setAttestation(wrongUid, att);
        mockIndexer.setIndex(randomUser, COINBASE_ACCOUNT_SCHEMA, wrongUid);
        assertEq(
            uint256(hook.getComplianceTier(randomUser)),
            uint256(MultiProviderComplianceHook.ComplianceTier.NONE)
        );
    }

    function test_beforeSwap_allowsVerifiedUser() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });
        vm.prank(FAKE_POOL_MANAGER);
        (bytes4 sel, , ) = hook.beforeSwap(
            address(0),
            poolKey,
            params,
            abi.encode(verifiedUser)
        );
        assertEq(sel, IHooks.beforeSwap.selector);
    }

    function test_beforeSwap_blocksUnverifiedUser() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });
        vm.prank(FAKE_POOL_MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiProviderComplianceHook.InsufficientCompliance.selector,
                unverifiedUser,
                MultiProviderComplianceHook.ComplianceTier.BASIC,
                MultiProviderComplianceHook.ComplianceTier.NONE
            )
        );
        hook.beforeSwap(
            address(0),
            poolKey,
            params,
            abi.encode(unverifiedUser)
        );
    }

    function test_beforeSwap_revertsIfNotPoolManager() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });
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
        vm.prank(FAKE_POOL_MANAGER);
        (bytes4 sel, , ) = hook.beforeSwap(
            address(0),
            poolKey,
            params,
            abi.encode(unverifiedUser)
        );
        assertEq(sel, IHooks.beforeSwap.selector);
    }

    function test_beforeSwap_enforcesMaxSwapAmount() public {
        hook.setPoolCompliance(
            poolKey,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            100e18
        );
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 200e18,
            sqrtPriceLimitX96: 0
        });
        vm.prank(FAKE_POOL_MANAGER);
        vm.expectRevert(
            abi.encodeWithSelector(
                MultiProviderComplianceHook.SwapExceedsLimit.selector,
                200e18,
                100e18
            )
        );
        hook.beforeSwap(address(0), poolKey, params, abi.encode(verifiedUser));
    }

    function test_beforeSwap_allowsWithinSwapLimit() public {
        hook.setPoolCompliance(
            poolKey,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            100e18
        );
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 50e18,
            sqrtPriceLimitX96: 0
        });
        vm.prank(FAKE_POOL_MANAGER);
        (bytes4 sel, , ) = hook.beforeSwap(
            address(0),
            poolKey,
            params,
            abi.encode(verifiedUser)
        );
        assertEq(sel, IHooks.beforeSwap.selector);
    }

    function test_batchSetManualOverrides() public {
        address[] memory users = new address[](3);
        users[0] = address(0xA001);
        users[1] = address(0xA002);
        users[2] = address(0xA003);
        hook.batchSetManualOverrides(
            users,
            MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL
        );
        for (uint256 i = 0; i < users.length; i++) {
            assertEq(
                uint256(hook.getComplianceTier(users[i])),
                uint256(
                    MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL
                )
            );
        }
    }

    function test_transferOwnership() public {
        address newOwner = address(0x9999);
        hook.transferOwnership(newOwner);
        assertEq(hook.owner(), newOwner);
        vm.expectRevert(MultiProviderComplianceHook.NotOwner.selector);
        hook.addTrustedSchema(
            keccak256("should.fail"),
            address(0),
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
    }

    function test_cacheInvalidation() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: 1e18,
            sqrtPriceLimitX96: 0
        });
        vm.prank(FAKE_POOL_MANAGER);
        hook.beforeSwap(address(0), poolKey, params, abi.encode(verifiedUser));
        hook.invalidateCache(verifiedUser);
        MultiProviderComplianceHook.ComplianceTier cached = hook
            .complianceCache(verifiedUser);
        assertEq(
            uint256(cached),
            uint256(MultiProviderComplianceHook.ComplianceTier.NONE)
        );
    }

    function test_cacheDurationUpdate() public {
        hook.setCacheDuration(2 days);
        assertEq(hook.cacheDuration(), 2 days);
    }
}
