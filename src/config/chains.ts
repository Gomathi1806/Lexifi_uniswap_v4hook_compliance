import { defineChain } from "viem";

/**
 * Robinhood Chain — an Arbitrum Orbit L2 where tokenized stocks and regulated stablecoins
 * trade. Coinbase Verifications do not exist here, so Lexifi reads identity from
 * SelfAttestationProvider instead.
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});
