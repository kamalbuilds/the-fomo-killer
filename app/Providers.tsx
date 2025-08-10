"use client"
import React, { ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    baseSepolia,
    base,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import { MiniKitProvider } from '@/providers/MiniKitProvider';

const config = getDefaultConfig({
    appName: 'Kill-FOMO',
    projectId: '0f869a1f7240141b3408d5d1fe42545a',
    chains: [base, baseSepolia],
    ssr: true,
});

const Providers = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient();

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    <MiniKitProvider>
                        {children}
                    </MiniKitProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

export default Providers;