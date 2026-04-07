[⠊] Compiling...
No files changed, compilation skipped
Script ran successfully.

== Logs ==
  === Register Multi-Provider Pool ===
  Deployer: 0x22bc13d2936f738bc820A6934FA8eC60EA51a621
  
  Pool: WETH/USDC (3000 fee, 60 tickSpacing)
  Pool ID:
  0x5a507c5ea4b300814ed28c88359ad1a5f449d964df4bf9cf2b6ecb39ab63ffdf
  
  Step 1: Registering InstitutionalPolicy on pool...
    Policy registered!
  Step 2: Configuring multi-provider (Coinbase + ZKPass)...
    Providers configured!
    - Provider 1: CoinbaseEASProvider (public attestation)
    - Provider 2: ZKPassProvider (private ZK proof)
    - Minimum required: 1 of 2
    - Minimum tier: RETAIL (1)
  
  Step 3: Verifying...
    Has compliance: true
    Policy: 0x312089B3A28Bb8345F7B887d96E1e46Fed4efC30
    Policy name: Lexifi Institutional Policy
    Admin: 0x22bc13d2936f738bc820A6934FA8eC60EA51a621
    Total pools: 1
  
    Config active: true
    Providers count: 2
    Min providers: 1
    Min tier: 1
  
  === MULTI-PROVIDER POOL REGISTERED ===
  Any user verified by EITHER Coinbase EAS OR zkPass ZK-proof
  can now trade on this pool.

## Setting up 1 EVM.

==========================

Chain 8453

Estimated gas price: 0.010125005 gwei

Estimated total gas used for script: 294424

Estimated amount required: 0.00000298104447212 ETH

==========================

##### base
✅  [Success] Hash: 0x98dfd469c2c72f0a9574931a8f2b2b4f40086b4c821396a93c53d55234b33576
Block: 43620438
Paid: 0.000000224316343845 ETH (43769 gas * 0.005125005 gwei)


##### base
✅  [Success] Hash: 0x86e6a6731155bcbc04fc15fef8fd0f74d65035cb285cee2d818cc8f0bd038979
Block: 43620439
Paid: 0.000000807429162735 ETH (157547 gas * 0.005125005 gwei)

✅ Sequence #1 on base | Total Paid: 0.00000103174550658 ETH (201316 gas * avg 0.005125005 gwei)
                                                            

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /Users/karthik/Downloads/compliance-hook-v4-fixed/broadcast/RegisterMultiProviderPool.s.sol/8453/run-latest.json

Sensitive values saved to: /Users/karthik/Downloads/compliance-hook-v4-fixed/cache/RegisterMultiProviderPool.s.sol/8453/run-latest.json