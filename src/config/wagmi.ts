import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Lexifi Dashboard",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [base, baseSepolia],
  ssr: true,
});
