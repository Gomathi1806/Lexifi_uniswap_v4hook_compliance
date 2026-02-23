// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// ═══════════════════════════════════════════════════════════════
// IMPORT PATHS: v4-core/ remaps to lib/v4-core/src/
// So "v4-core/libraries/Hooks.sol" → lib/v4-core/src/libraries/Hooks.sol
// DO NOT use "v4-core/src/" — that doubles to lib/v4-core/src/src/
// ═══════════════════════════════════════════════════════════════

import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/types/BeforeSwapDelta.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {IEAS, Attestation} from "./interfaces/IEAS.sol";
import {IAttestationIndexer} from "./interfaces/IAttestationIndexer.sol";

/// @title MultiProviderComplianceHook
/// @notice A Uniswap V4 hook that enforces KYC/AML compliance using EAS attestations
/// @dev Supports multiple attestation providers (Coinbase Verifications, Civic, custom)
///      Implements IHooks directly (no BaseHook dependency)
///
/// Differentiator vs Coinbase Verified Pools:
///   - Multi-provider: accepts attestations from ANY trusted EAS issuer
///   - Configurable: pool deployers set their own compliance requirements
///   - Tiered: different compliance levels unlock different pool features
///
contract MultiProviderComplianceHook is IHooks {
    using PoolIdLibrary for PoolKey;

    // ═══════════════════════════════════════════
    //                  TYPES
    // ═══════════════════════════════════════════

    enum ComplianceTier {
        NONE,           // No verification
        BASIC,          // Has any trusted attestation
        ENHANCED,       // Attestation + country verified
        INSTITUTIONAL   // Full KYC from approved institutional provider
    }

    struct TrustedSchema {
        bytes32 schemaId;
        address expectedAttester;   // Who must have issued it (address(0) = any)
        ComplianceTier tier;
        bool requiresCountry;
        bool active;
    }

    struct PoolCompliance {
        ComplianceTier minimumTier;
        bool active;
        uint256 maxSwapAmount;      // 0 = unlimited
    }

    // ═══════════════════════════════════════════
    //              STATE VARIABLES
    // ═══════════════════════════════════════════

    IPoolManager public immutable poolManager;
    IEAS public immutable eas;
    IAttestationIndexer public attestationIndexer;

    address public owner;

    mapping(bytes32 => TrustedSchema) public trustedSchemas;
    bytes32[] public schemaList;

    mapping(PoolId => PoolCompliance) public poolCompliance;
    mapping(address => ComplianceTier) public manualOverrides;

    // Gas-saving cache
    mapping(address => ComplianceTier) public complianceCache;
    mapping(address => uint256) public cacheTimestamp;
    uint256 public cacheDuration = 1 days;

    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    event SchemaAdded(bytes32 indexed schemaId, address attester, ComplianceTier tier);
    event SchemaRemoved(bytes32 indexed schemaId);
    event PoolComplianceSet(PoolId indexed poolId, ComplianceTier minimumTier, uint256 maxSwapAmount);
    event ComplianceChecked(address indexed user, ComplianceTier tier, bool allowed);
    event ManualOverrideSet(address indexed user, ComplianceTier tier);
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);

    // ═══════════════════════════════════════════
    //                  ERRORS
    // ═══════════════════════════════════════════

    error NotOwner();
    error NotPoolManager();
    error InsufficientCompliance(address user, ComplianceTier required, ComplianceTier actual);
    error SwapExceedsLimit(uint256 amount, uint256 limit);
    error SchemaAlreadyExists();
    error InvalidSchema();
    error HookNotImplemented();

    // ═══════════════════════════════════════════
    //               CONSTRUCTOR
    // ═══════════════════════════════════════════

    constructor(
        IPoolManager _poolManager,
        address _eas,
        address _attestationIndexer
    ) {
        poolManager = _poolManager;
        eas = IEAS(_eas);
        if (_attestationIndexer != address(0)) {
            attestationIndexer = IAttestationIndexer(_attestationIndexer);
        }
        owner = msg.sender;
    }

    // ═══════════════════════════════════════════
    //          HOOK PERMISSION VALIDATION
    // ═══════════════════════════════════════════

    /// @notice Validate that this contract's address encodes the correct hook flags
    /// @dev V4 requires hook addresses to have specific bits set matching implemented hooks
    function validateHookAddress() external view {
        Hooks.validateHookPermissions(
            IHooks(address(this)),
            Hooks.Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeAddLiquidity: true,       // We gate LP additions
                afterAddLiquidity: false,
                beforeRemoveLiquidity: false,    // NEVER block exits
                afterRemoveLiquidity: false,
                beforeSwap: true,               // We gate swaps
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            })
        );
    }

    // ═══════════════════════════════════════════
    //         IMPLEMENTED HOOKS (2 of 10)
    // ═══════════════════════════════════════════

    /// @notice Check compliance before allowing a swap
    function beforeSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        _onlyPoolManager();

        PoolId poolId = key.toId();
        PoolCompliance memory config = poolCompliance[poolId];

        // If compliance not active for this pool, allow all swaps
        if (!config.active) {
            return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
        }

        // Extract swapper from hookData, fallback to tx.origin
        address swapper = hookData.length >= 20
            ? abi.decode(hookData, (address))
            : tx.origin;

        // Check compliance tier
        ComplianceTier userTier = _getComplianceTier(swapper);

        if (userTier < config.minimumTier) {
            revert InsufficientCompliance(swapper, config.minimumTier, userTier);
        }

        // Check swap amount limits
        if (config.maxSwapAmount > 0) {
            uint256 amount = params.amountSpecified > 0
                ? uint256(params.amountSpecified)
                : uint256(-params.amountSpecified);

            if (amount > config.maxSwapAmount) {
                revert SwapExceedsLimit(amount, config.maxSwapAmount);
            }
        }

        emit ComplianceChecked(swapper, userTier, true);

        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    /// @notice Check compliance before allowing liquidity addition
    function beforeAddLiquidity(
        address,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata hookData
    ) external override returns (bytes4) {
        _onlyPoolManager();

        PoolId poolId = key.toId();
        PoolCompliance memory config = poolCompliance[poolId];

        if (!config.active) {
            return IHooks.beforeAddLiquidity.selector;
        }

        address provider = hookData.length >= 20
            ? abi.decode(hookData, (address))
            : tx.origin;

        ComplianceTier userTier = _getComplianceTier(provider);

        if (userTier < config.minimumTier) {
            revert InsufficientCompliance(provider, config.minimumTier, userTier);
        }

        emit ComplianceChecked(provider, userTier, true);

        return IHooks.beforeAddLiquidity.selector;
    }

    // ═══════════════════════════════════════════
    //       UNIMPLEMENTED HOOKS (return selector)
    // ═══════════════════════════════════════════

    function beforeInitialize(address, PoolKey calldata, uint160) external pure override returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure override returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function afterAddLiquidity(
        address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta, BalanceDelta, bytes calldata
    ) external pure override returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    // NEVER block exits — critical trust signal
    function beforeRemoveLiquidity(
        address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata
    ) external pure override returns (bytes4) {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(
        address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta, BalanceDelta, bytes calldata
    ) external pure override returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function afterSwap(
        address, PoolKey calldata, IPoolManager.SwapParams calldata,
        BalanceDelta, bytes calldata
    ) external pure override returns (bytes4, int128) {
        return (IHooks.afterSwap.selector, 0);
    }

    function beforeDonate(
        address, PoolKey calldata, uint256, uint256, bytes calldata
    ) external pure override returns (bytes4) {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(
        address, PoolKey calldata, uint256, uint256, bytes calldata
    ) external pure override returns (bytes4) {
        return IHooks.afterDonate.selector;
    }

    // ═══════════════════════════════════════════
    //          COMPLIANCE CHECK LOGIC
    // ═══════════════════════════════════════════

    function _getComplianceTier(address user) internal returns (ComplianceTier) {
        // 1. Manual override (highest priority)
        if (manualOverrides[user] != ComplianceTier.NONE) {
            return manualOverrides[user];
        }

        // 2. Check cache
        if (
            complianceCache[user] != ComplianceTier.NONE
                && block.timestamp - cacheTimestamp[user] < cacheDuration
        ) {
            return complianceCache[user];
        }

        // 3. Check on-chain attestations
        ComplianceTier highestTier = ComplianceTier.NONE;

        for (uint256 i = 0; i < schemaList.length; i++) {
            TrustedSchema memory schema = trustedSchemas[schemaList[i]];
            if (!schema.active) continue;

            ComplianceTier tier = _checkAttestation(user, schema);
            if (tier > highestTier) {
                highestTier = tier;
            }
            if (highestTier == ComplianceTier.INSTITUTIONAL) break;
        }

        // Update cache
        if (highestTier != ComplianceTier.NONE) {
            complianceCache[user] = highestTier;
            cacheTimestamp[user] = block.timestamp;
        }

        return highestTier;
    }

    function _checkAttestation(
        address user,
        TrustedSchema memory schema
    ) internal view returns (ComplianceTier) {
        bytes32 uid;

        // Try indexer first (gas efficient)
        if (address(attestationIndexer) != address(0)) {
            uid = attestationIndexer.getAttestationUid(user, schema.schemaId);
        }

        if (uid == bytes32(0)) {
            return ComplianceTier.NONE;
        }

        // Validate attestation
        if (!eas.isAttestationValid(uid)) {
            return ComplianceTier.NONE;
        }

        Attestation memory att = eas.getAttestation(uid);

        if (att.recipient != user) return ComplianceTier.NONE;
        if (schema.expectedAttester != address(0) && att.attester != schema.expectedAttester) {
            return ComplianceTier.NONE;
        }
        if (att.expirationTime != 0 && att.expirationTime < block.timestamp) {
            return ComplianceTier.NONE;
        }
        if (att.revocationTime != 0) return ComplianceTier.NONE;

        return schema.tier;
    }

    /// @notice Public view — check a user's compliance tier (no cache update)
    function getComplianceTier(address user) external view returns (ComplianceTier) {
        if (manualOverrides[user] != ComplianceTier.NONE) {
            return manualOverrides[user];
        }

        if (
            complianceCache[user] != ComplianceTier.NONE
                && block.timestamp - cacheTimestamp[user] < cacheDuration
        ) {
            return complianceCache[user];
        }

        ComplianceTier highestTier = ComplianceTier.NONE;
        for (uint256 i = 0; i < schemaList.length; i++) {
            TrustedSchema memory schema = trustedSchemas[schemaList[i]];
            if (!schema.active) continue;
            ComplianceTier tier = _checkAttestation(user, schema);
            if (tier > highestTier) highestTier = tier;
            if (highestTier == ComplianceTier.INSTITUTIONAL) break;
        }

        return highestTier;
    }

    // ═══════════════════════════════════════════
    //            ADMIN FUNCTIONS
    // ═══════════════════════════════════════════

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function _onlyPoolManager() internal view {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
    }

    function addTrustedSchema(
        bytes32 schemaId,
        address expectedAttester,
        ComplianceTier tier,
        bool requiresCountry
    ) external onlyOwner {
        if (trustedSchemas[schemaId].schemaId != bytes32(0)) revert SchemaAlreadyExists();
        if (schemaId == bytes32(0)) revert InvalidSchema();

        trustedSchemas[schemaId] = TrustedSchema({
            schemaId: schemaId,
            expectedAttester: expectedAttester,
            tier: tier,
            requiresCountry: requiresCountry,
            active: true
        });

        schemaList.push(schemaId);
        emit SchemaAdded(schemaId, expectedAttester, tier);
    }

    function deactivateSchema(bytes32 schemaId) external onlyOwner {
        trustedSchemas[schemaId].active = false;
        emit SchemaRemoved(schemaId);
    }

    function setPoolCompliance(
        PoolKey calldata key,
        ComplianceTier minimumTier,
        uint256 maxSwapAmount
    ) external onlyOwner {
        PoolId poolId = key.toId();
        poolCompliance[poolId] = PoolCompliance({
            minimumTier: minimumTier,
            active: true,
            maxSwapAmount: maxSwapAmount
        });
        emit PoolComplianceSet(poolId, minimumTier, maxSwapAmount);
    }

    function disablePoolCompliance(PoolKey calldata key) external onlyOwner {
        PoolId poolId = key.toId();
        poolCompliance[poolId].active = false;
    }

    function setManualOverride(address user, ComplianceTier tier) external onlyOwner {
        manualOverrides[user] = tier;
        emit ManualOverrideSet(user, tier);
    }

    function batchSetManualOverrides(
        address[] calldata users,
        ComplianceTier tier
    ) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            manualOverrides[users[i]] = tier;
            emit ManualOverrideSet(users[i], tier);
        }
    }

    function setAttestationIndexer(address _indexer) external onlyOwner {
        attestationIndexer = IAttestationIndexer(_indexer);
    }

    function setCacheDuration(uint256 _duration) external onlyOwner {
        cacheDuration = _duration;
    }

    function invalidateCache(address user) external onlyOwner {
        delete complianceCache[user];
        delete cacheTimestamp[user];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ═══════════════════════════════════════════
    //              VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    function getSchemaCount() external view returns (uint256) {
        return schemaList.length;
    }

    function isPoolCompliant(PoolKey calldata key) external view returns (bool) {
        return poolCompliance[key.toId()].active;
    }
}
