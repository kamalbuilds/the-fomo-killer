'use client'
import { useEffect, useState } from 'react'
import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { base } from 'wagmi/chains'
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query"


export const config = getDefaultConfig({
  appName: 'Awesome MCP',
  projectId: '7af87411465d394d184863096c8b645c',
  chains: [base],
  ssr: true, 
});


const queryClient = new QueryClient();


export default function RainbowKitWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 始终提供 WagmiProvider，但在未挂载时不渲染 RainbowKitProvider
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {
        // mounted ? (
          <RainbowKitProvider theme={darkTheme({
              accentColor: '#E0E0E0',
              accentColorForeground: 'black',
              borderRadius: "large",
              overlayBlur: "small",
            })}
            locale='en'
            >
            {children}
          </RainbowKitProvider>
        // ) : (
        //   children
        // )
        }
      </QueryClientProvider>
    </WagmiProvider>
  );
} 