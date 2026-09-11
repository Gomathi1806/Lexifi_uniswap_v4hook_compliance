// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {CompliancePoolHelper} from "../src/CompliancePoolHelper.sol";

contract DeployHelperV2 is Script {
    address constant POOL_MANAGER = 0x498581fF718922c3f8e6A244956aF099B2652b2b;

    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        CompliancePoolHelper helper = new CompliancePoolHelper(POOL_MANAGER);
        console.log("Helper V2 deployed:", address(helper));

        vm.stopBroadcast();
    }
}
