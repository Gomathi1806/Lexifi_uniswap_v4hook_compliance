// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {MultiProviderComplianceHook} from "../src/MultiProviderComplianceHook.sol";

/// @notice Deploys MultiProviderComplianceHook to Base Mainnet
/// FIXED: Operator precedence bug in flag check + removed duplicate CREATE2_FACTORY
contract DeployMainnet is Script {
    address constant POOL_MANAGER = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address constant EAS = 0x4200000000000000000000000000000000000021;
    address constant COINBASE_INDEXER =
        0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C;
    address constant COINBASE_ATTESTER =
        0x357458739F90461b99789350868CD7CF330Dd7EE;

    bytes32 constant CB_ACCOUNT_SCHEMA =
        0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9;
    bytes32 constant CB_COUNTRY_SCHEMA =
        0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065;
    bytes32 constant CB_BUSINESS_ACCOUNT_SCHEMA =
        0xf82663c0eac879bed1e09e3d4598752359a321f51b38ae669728f480abf3f474;
    bytes32 constant CB_BUSINESS_COUNTRY_SCHEMA =
        0xf87445e61219642b989807bc418e5d5fa8e3adb49e230891055a997121f6c80b;

    // Note: CREATE2_FACTORY is already defined in forge-std/Script.sol

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== BASE MAINNET DEPLOYMENT (FIXED) ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG
        );

        bytes memory constructorArgs = abi.encode(
            POOL_MANAGER,
            EAS,
            COINBASE_INDEXER
        );
        bytes memory creationCode = type(MultiProviderComplianceHook)
            .creationCode;
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 bytecodeHash = keccak256(bytecode);

        console.log("Mining salt for valid hook address...");

        bytes32 salt;
        address hookAddress;
        bool found = false;

        for (uint256 i = 200; i < 1000000; i++) {
            salt = bytes32(i);
            hookAddress = address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                CREATE2_FACTORY,
                                salt,
                                bytecodeHash
                            )
                        )
                    )
                )
            );

            // FIXED: parentheses around & operation
            // Old bug: & has lower precedence than ==
            if ((uint160(hookAddress) & flags) == flags) {
                found = true;
                console.log("Found valid hook address:", hookAddress);
                console.log("Salt:", i);
                break;
            }
        }

        require(found, "Failed to mine valid hook address");

        vm.startBroadcast(deployerPrivateKey);

        bytes memory payload = abi.encodePacked(salt, bytecode);
        (bool success, ) = CREATE2_FACTORY.call(payload);
        require(success, "CREATE2 factory call failed");
        require(hookAddress.code.length > 0, "Hook not deployed");

        MultiProviderComplianceHook hook = MultiProviderComplianceHook(
            hookAddress
        );

        hook.addTrustedSchema(
            CB_ACCOUNT_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
        console.log("Added: Verified Account (BASIC)");

        hook.addTrustedSchema(
            CB_COUNTRY_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.ENHANCED,
            true
        );
        console.log("Added: Verified Country (ENHANCED)");

        hook.addTrustedSchema(
            CB_BUSINESS_ACCOUNT_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.ENHANCED,
            false
        );
        console.log("Added: Verified Business Account (ENHANCED)");

        hook.addTrustedSchema(
            CB_BUSINESS_COUNTRY_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.INSTITUTIONAL,
            true
        );
        console.log("Added: Verified Business Country (INSTITUTIONAL)");

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Hook:", hookAddress);
        console.log("Owner:", deployer);
        console.log("Schemas configured: 4");
    }
}
