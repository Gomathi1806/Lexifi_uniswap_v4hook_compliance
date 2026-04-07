// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";

interface ILexifiHook {
    function setPoolPolicy(PoolKey calldata key, address policy) external;
    function getPoolInfo(PoolKey calldata key) external view returns (bool, address, string memory, address);
    function totalPools() external view returns (uint256);
}

interface IInstitutionalPolicy {
    function setInstitutionalConfig(bytes32 poolId, address[] calldata providers, uint256 minProviders, uint8 minTier) external;
    function getConfig(bytes32 poolId) external view returns (address[] memory, uint256, uint8, bool);
}

contract RegisterMultiProviderPool is Script {
    using PoolIdLibrary for PoolKey;

    // Base Mainnet addresses
    address constant HOOK = 0xb8ab80d89620c29E71563779111b9cb1d4d92880;
    address constant INSTITUTIONAL_POLICY = 0x312089B3A28Bb8345F7B887d96E1e46Fed4efC30;
    address constant COINBASE_PROVIDER = 0x9Da4bDb53cA77e1788263771fA7459Fec098E1d7;
    address constant ZKPASS_PROVIDER = 0x929E5aB25B8E5F37c85dF59792FB24aDe61Cb646;

    // Pool tokens
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console.log("=== Register Multi-Provider Pool ===");
        console.log("Deployer:", deployer);
        console.log("");

        // Build pool key
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(WETH),
            currency1: Currency.wrap(USDC),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        // Compute pool ID
        PoolId poolId = poolKey.toId();
        bytes32 poolIdBytes = PoolId.unwrap(poolId);

        console.log("Pool: WETH/USDC (3000 fee, 60 tickSpacing)");
        console.log("Pool ID:");
        console.logBytes32(poolIdBytes);
        console.log("");

        vm.startBroadcast(pk);

        // Step 1: Register InstitutionalPolicy on this pool via LexifiHook
        console.log("Step 1: Registering InstitutionalPolicy on pool...");
        ILexifiHook(HOOK).setPoolPolicy(poolKey, INSTITUTIONAL_POLICY);
        console.log("  Policy registered!");

        // Step 2: Configure InstitutionalPolicy with both providers
        // Require 1-of-2 providers at RETAIL (tier 1) minimum
        // Using 1-of-2 so either Coinbase OR ZKPass is sufficient
        // Change to 2 for maximum security (both required)
        console.log("Step 2: Configuring multi-provider (Coinbase + ZKPass)...");

        address[] memory providers = new address[](2);
        providers[0] = COINBASE_PROVIDER;
        providers[1] = ZKPASS_PROVIDER;

        uint256 minProviders = 1;  // 1-of-2: either provider is sufficient
        uint8 minTier = 1;         // RETAIL minimum

        IInstitutionalPolicy(INSTITUTIONAL_POLICY).setInstitutionalConfig(
            poolIdBytes,
            providers,
            minProviders,
            minTier
        );
        console.log("  Providers configured!");
        console.log("  - Provider 1: CoinbaseEASProvider (public attestation)");
        console.log("  - Provider 2: ZKPassProvider (private ZK proof)");
        console.log("  - Minimum required: 1 of 2");
        console.log("  - Minimum tier: RETAIL (1)");

        vm.stopBroadcast();

        // Step 3: Verify registration
        console.log("");
        console.log("Step 3: Verifying...");

        (bool hasCompliance, address policy, string memory policyName, address admin) =
            ILexifiHook(HOOK).getPoolInfo(poolKey);

        console.log("  Has compliance:", hasCompliance);
        console.log("  Policy:", policy);
        console.log("  Policy name:", policyName);
        console.log("  Admin:", admin);

        uint256 totalPools = ILexifiHook(HOOK).totalPools();
        console.log("  Total pools:", totalPools);

        (address[] memory cfgProviders, uint256 cfgMin, uint8 cfgTier, bool active) =
            IInstitutionalPolicy(INSTITUTIONAL_POLICY).getConfig(poolIdBytes);

        console.log("");
        console.log("  Config active:", active);
        console.log("  Providers count:", cfgProviders.length);
        console.log("  Min providers:", cfgMin);
        console.log("  Min tier:", cfgTier);

        console.log("");
        console.log("=== MULTI-PROVIDER POOL REGISTERED ===");
        console.log("Any user verified by EITHER Coinbase EAS OR zkPass ZK-proof");
        console.log("can now trade on this pool.");
    }
}
