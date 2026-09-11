# Archived: v1 Solidity prototype

This folder holds the first-generation Lexifi contracts (`MultiProviderComplianceHook`,
`ZKPassProvider`, the `CompliancePoolHelper` routers) and the Foundry scripts and tests that
went with them. They were moved here on 2026-09-11 so that this repository contains only the
dashboard.

**Nothing in this folder is live or supported.** Do not deploy, fork or integrate against it.

- The v1 owner key `0x22bc…a621` was compromised.
- The v1 Coinbase EAS provider had the EAS `recipient` and `attester` fields swapped, so every
  verification silently returned tier 0.
- The Foundry submodules this code compiled against were removed in the same change, so it no
  longer builds in place. To build it, check out commit `f152c8b` or earlier.

The current contracts live in
[github.com/Gomathi1806/lexifi-contracts](https://github.com/Gomathi1806/lexifi-contracts).
