// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {MultiProviderComplianceHook} from "../src/MultiProviderComplianceHook.sol";

/// @notice Deploys MultiProviderComplianceHook to Base Sepolia or Base Mainnet
contract DeployComplianceHook is Script {

    // ═══════════════════════════════════════════
    //          BASE NETWORK ADDRESSES
    // ═══════════════════════════════════════════

    // Uniswap V4 PoolManager on Base Sepolia
    // Check https://docs.uniswap.org for latest addresses
    address constant BASE_SEPOLIA_POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;

    // EAS predeploy on OP Stack chains (Base Sepolia + Mainnet)
    address constant EAS = 0x4200000000000000000000000000000000000021;

    // Coinbase Attestation Indexer on Base
    // Check https://github.com/coinbase/verifications for latest
    address constant COINBASE_INDEXER = 0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C;

    // Coinbase Attester address on Base
    address constant COINBASE_ATTESTER = 0x357458739F90461b99789350868CD7CF330Dd7EE;

    // Coinbase Verification Schema IDs on Base
    bytes32 constant CB_ACCOUNT_SCHEMA = 0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9;
    bytes32 constant CB_COUNTRY_SCHEMA = 0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        // Hook address must have correct flag bits set
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG
        );

        bytes memory constructorArgs = abi.encode(
            BASE_SEPOLIA_POOL_MANAGER,
            EAS,
            COINBASE_INDEXER
        );

        bytes memory creationCode = type(MultiProviderComplianceHook).creationCode;
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 bytecodeHash = keccak256(bytecode);

        console.log("Mining hook address with correct flag bits...");

        // Mine a CREATE2 salt that produces an address with correct flags
        bytes32 salt;
        address hookAddress;
        bool found = false;

        for (uint256 i = 0; i < 200000; i++) {
            salt = bytes32(i);
            hookAddress = _computeCreate2Address(salt, bytecodeHash, deployer);
            if (uint160(hookAddress) & flags == flags) {
                found = true;
                break;
            }
        }

        require(found, "Failed to mine valid hook address — increase loop limit");

        console.log("Found valid hook address:", hookAddress);
        console.log("Salt:", uint256(salt));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy via CREATE2
        address deployed;
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(deployed != address(0), "CREATE2 deployment failed");
        require(deployed == hookAddress, "Deployment address mismatch");

        MultiProviderComplianceHook hook = MultiProviderComplianceHook(deployed);

        // Configure Coinbase Verifications as trusted
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
        console.log("Hook:", deployed);
        console.log("Owner:", deployer);
    }

    function _computeCreate2Address(
        bytes32 salt,
        bytes32 bytecodeHash,
        address deployer
    ) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            deployer,
            salt,
            bytecodeHash
        )))));
    }
}
