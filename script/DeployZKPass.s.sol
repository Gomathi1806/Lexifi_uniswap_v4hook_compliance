// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ZKPassProvider} from "../src/providers/ZKPassProvider.sol";

contract DeployZKPass is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(pk);
        
        ZKPassProvider provider = new ZKPassProvider(
            0x357458739F90461b99789350868CD7CF330Dd7EE,
            deployer
        );
        
        console.log("ZKPassProvider:", address(provider));
        
        vm.stopBroadcast();
    }
}
