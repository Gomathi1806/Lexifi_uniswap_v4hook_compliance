// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {IAttestationIndexer} from "../src/interfaces/IAttestationIndexer.sol";
import {IEAS, Attestation} from "../src/interfaces/IEAS.sol";

/// @notice Fork test - reads REAL Coinbase Verifications on Base mainnet
/// Run with: forge test --match-contract ForkTest --fork-url https://mainnet.base.org -vvv
contract CoinbaseVerificationForkTest is Test {
    // Real Base mainnet addresses (verified from coinbase/verifications GitHub)
    address constant EAS = 0x4200000000000000000000000000000000000021;
    address constant COINBASE_INDEXER =
        0x2c7eE1E5f416dfF40054c27A62f7B357C4E8619C;
    address constant COINBASE_ATTESTER =
        0x357458739F90461b99789350868CD7CF330Dd7EE;

    bytes32 constant CB_ACCOUNT_SCHEMA =
        0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9;
    bytes32 constant CB_COUNTRY_SCHEMA =
        0x1801901fabd0e6189356b4fb52bb0ab855276d84f7ec140839fbd1f6801ca065;

    // YOUR verified wallet
    address constant MY_WALLET = 0x22bc13d2936f738bc820A6934FA8eC60EA51a621;

    // A random wallet that is NOT Coinbase verified
    address constant UNVERIFIED_WALLET =
        0x0000000000000000000000000000000000000001;

    IEAS eas = IEAS(EAS);
    IAttestationIndexer indexer = IAttestationIndexer(COINBASE_INDEXER);

    function test_indexerReturnsAttestationForVerifiedWallet() public view {
        bytes32 uid = indexer.getAttestationUid(MY_WALLET, CB_ACCOUNT_SCHEMA);
        console.log("Attestation UID for your wallet:");
        console.logBytes32(uid);
        assertTrue(
            uid != bytes32(0),
            "No attestation found - wallet not verified"
        );
    }

    function test_attestationIsValid() public view {
        bytes32 uid = indexer.getAttestationUid(MY_WALLET, CB_ACCOUNT_SCHEMA);
        require(uid != bytes32(0), "No attestation found");

        bool valid = eas.isAttestationValid(uid);
        assertTrue(valid, "Attestation is not valid");
        console.log("Attestation is valid:", valid);
    }

    function test_attestationDetailsAreCorrect() public view {
        bytes32 uid = indexer.getAttestationUid(MY_WALLET, CB_ACCOUNT_SCHEMA);
        require(uid != bytes32(0), "No attestation found");

        Attestation memory att = eas.getAttestation(uid);

        console.log("Attester:", att.attester);
        console.log("Recipient:", att.recipient);
        console.log("Time:", att.time);
        console.log("Expiration:", att.expirationTime);
        console.log("Revocation:", att.revocationTime);

        // Verify all fields match what our hook checks
        assertEq(att.recipient, MY_WALLET, "Wrong recipient");
        assertEq(att.attester, COINBASE_ATTESTER, "Wrong attester");
        assertEq(att.revocationTime, 0, "Attestation is revoked");
        // expirationTime == 0 means never expires
        assertTrue(
            att.expirationTime == 0 || att.expirationTime > block.timestamp,
            "Attestation expired"
        );

        console.log("ALL CHECKS PASSED - wallet is Coinbase verified");
    }

    function test_unverifiedWalletReturnsNoAttestation() public view {
        bytes32 uid = indexer.getAttestationUid(
            UNVERIFIED_WALLET,
            CB_ACCOUNT_SCHEMA
        );
        assertEq(
            uid,
            bytes32(0),
            "Unverified wallet should have no attestation"
        );
        console.log("Unverified wallet correctly returns no attestation");
    }

    function test_checkCountryVerification() public view {
        bytes32 uid = indexer.getAttestationUid(MY_WALLET, CB_COUNTRY_SCHEMA);
        if (uid != bytes32(0)) {
            Attestation memory att = eas.getAttestation(uid);
            console.log("Country attestation found!");
            console.log("Attester:", att.attester);
            console.logBytes(att.data);
        } else {
            console.log("No country verification found (optional)");
        }
    }
}
