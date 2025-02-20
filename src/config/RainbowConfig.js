import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {  base, baseSepolia, mainnet, seiTestnet, sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();


const nibiruTestnet = {
  id: 7210,
  name: "Nibiru Testnet-1",
  network: "nibiru-testnet-1",
  nativeCurrency: {
    name: "Nibiru",
    symbol: "NIBI",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://evm-rpc.testnet-1.nibiru.fi"] },
    public: { http: ["https://evm-rpc.testnet-1.nibiru.fi"] },
  },
  blockExplorers: {
    default: {
      name: "Nibiru Explorer",
      url: "https://evm-explorer.nibiru.fi",
    },
  },
  testnet: true,
};
const config = getDefaultConfig({
  appName: 'Swpity',
  projectId: '853b0bbcf1b9be7f8d3ffb02b5a54c66',
  chains: [ baseSepolia, base, mainnet, nibiruTestnet  ],
  ssr: true,
  mobileOptions: {
    enableDeepLinking: true,
    deepLink: 'metamask',
  },
});

export {
  config,
  RainbowKitProvider,
  QueryClientProvider,
  queryClient,
  WagmiProvider,
};
