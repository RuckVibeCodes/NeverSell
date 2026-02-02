import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { 
  arbitrum,
  arbitrumSepolia,
} from "wagmi/chains";
import { http } from "wagmi";

export const config = getDefaultConfig({
  appName: "NeverSell",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo",
  chains: [arbitrum, arbitrumSepolia],
  ssr: true,
});
