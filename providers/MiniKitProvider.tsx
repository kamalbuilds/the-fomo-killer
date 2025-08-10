'use client';

import { MiniKitProvider as OnchainKitMiniKitProvider } from '@coinbase/onchainkit/minikit';
import { ReactNode } from 'react';
import { base, baseSepolia } from 'wagmi/chains';

export function MiniKitProvider({ children }: { children: ReactNode }) {
  const isProduction = process.env.NEXT_PUBLIC_NETWORK_ID === 'base-mainnet';
  const chain = isProduction ? base : baseSepolia;
  
  return (
    <OnchainKitMiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY || process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={chain}
    >
      {children}
    </OnchainKitMiniKitProvider>
  );
}