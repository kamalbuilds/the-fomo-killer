import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3005';
  const projectName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Kill-FOMO DeFi Agent';
  
  return {
    title: projectName,
    description: "AI-powered DeFi agents on Base with CDP integration, x402 payments, and XMTP messaging",
    openGraph: {
      title: process.env.NEXT_PUBLIC_APP_OG_TITLE || projectName,
      description: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || "Access premium DeFi insights and automated trading through intelligent agents",
      images: [process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${URL}/og-image.png`],
      url: URL,
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero-image.png`,
        button: {
          title: `Launch ${projectName}`,
          action: {
            type: "launch_frame",
            name: projectName,
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/splash.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#1E293B",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}