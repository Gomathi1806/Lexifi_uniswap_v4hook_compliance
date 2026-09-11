// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {MultiProviderComplianceHook} from "../src/MultiProviderComplianceHook.sol";

/// @notice Deploys MultiProviderComplianceHook to Base Sepolia
contract DeployComplianceHook is Script {
    // Uniswap V4 PoolManager on Base Sepolia
    address constant BASE_SEPOLIA_POOL_MANAGER =
        0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;

    // EAS predeploy on OP Stack (Base)
    address constant EAS = 0x4200000000000000000000000000000000000021;

    // Coinbase Attestation Indexer on Base
    address constant COINBASE_INDEXER =
        0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C;

    // Coinbase Attester address
    address constant COINBASE_ATTESTER =
        0x357458739F90461b99789350868CD7CF330Dd7EE;

    // Coinbase Verification Schema IDs
    bytes32 constant CB_ACCOUNT_SCHEMA =
        0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9;
    bytes32 constant CB_COUNTRY_SCHEMA =
        0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065;

    // Deterministic CREATE2 deployer - exists on all EVM chains

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        // Required hook flags
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG
        );

        // Build bytecode
        bytes memory constructorArgs = abi.encode(
            BASE_SEPOLIA_POOL_MANAGER,
            EAS,
            COINBASE_INDEXER
        );
        bytes memory creationCode = type(MultiProviderComplianceHook)
            .creationCode;
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 bytecodeHash = keccak256(bytecode);

        console.log("Mining salt for valid hook address...");

        // Mine salt using the CREATE2 factory as deployer
        bytes32 salt;
        address hookAddress;
        bool found = false;

        for (uint256 i = 100; i < 500000; i++) {
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

            if (uint160(hookAddress) & flags == flags) {
                found = true;
                break;
            }
        }

        require(
            found,
            "Failed to mine valid hook address - increase loop limit"
        );

        console.log("Found valid hook address:", hookAddress);
        console.log("Salt:", uint256(salt));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy via the deterministic CREATE2 factory
        // Send: salt (32 bytes) ++ bytecode to the factory address
        bytes memory payload = abi.encodePacked(salt, bytecode);
        (bool success, ) = CREATE2_FACTORY.call(payload);
        require(success, "CREATE2 factory call failed");

        // Verify deployment
        require(
            hookAddress.code.length > 0,
            "Hook not deployed at expected address"
        );

        MultiProviderComplianceHook hook = MultiProviderComplianceHook(
            hookAddress
        );

        console.log("Hook deployed at:", hookAddress);

        // Configure Coinbase Verifications as trusted schemas
        hook.addTrustedSchema(
            CB_ACCOUNT_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.BASIC,
            false
        );
        console.log("Added Coinbase Account schema (BASIC tier)");

        hook.addTrustedSchema(
            CB_COUNTRY_SCHEMA,
            COINBASE_ATTESTER,
            MultiProviderComplianceHook.ComplianceTier.ENHANCED,
            true
        );
        console.log("Added Coinbase Country schema (ENHANCED tier)");

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Hook:", hookAddress);
        console.log("Owner:", deployer);
    }
}
