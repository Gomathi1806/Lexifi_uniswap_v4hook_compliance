// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {CompliancePoolHelper} from "../src/CompliancePoolHelper.sol";

contract DeployPoolHelper is Script {
    // ═══ BASE MAINNET ADDRESSES ═══
    address constant POOL_MANAGER = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address constant HOOK = 0x8916BCB70334D6161E07c438fcCDA8A8Cd8d3DF9;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(pk);

        // 1. Deploy helper contract
        CompliancePoolHelper helper = new CompliancePoolHelper(POOL_MANAGER);
        console.log("Helper deployed:", address(helper));

        // 2. Initialize pool: WETH/USDC with compliance hook
        //    WETH (0x4200...) < USDC (0x8335...) so WETH=currency0, USDC=currency1
        //    Price = USDC per WETH in base units = 2700 * 1e6 / 1e18 = 2.7e-9
        //    sqrtPriceX96 = sqrt(2.7e-9) * 2^96 ≈ 4,116,060,000,000,000,000,000,000
        uint160 sqrtPriceX96 = 4_116_060_000_000_000_000_000_000;

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(WETH),
            currency1: Currency.wrap(USDC),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        IPoolManager(POOL_MANAGER).initialize(poolKey, sqrtPriceX96);
        console.log("Pool initialized: WETH/USDC with ComplianceHook!");

        vm.stopBroadcast();

        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("Helper:", address(helper));
        console.log("1. Approve WETH + USDC to helper");
        console.log("2. Add liquidity");
        console.log("3. Swap!");
    }
}
