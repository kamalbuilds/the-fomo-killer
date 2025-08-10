function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3005';
  const projectName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Kill-FOMO DeFi Agent';

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: "1",
      name: projectName,
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || "AI-Powered DeFi Agents on Base",
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 
        "Access premium DeFi insights, automated trading, and intelligent agents powered by CDP, x402 payments, and XMTP messaging",
      screenshotUrls: process.env.NEXT_PUBLIC_APP_SCREENSHOTS?.split(',') || [],
      iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icon.png`,
      splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/splash.png`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#1E293B",
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "defi",
      tags: ["defi", "trading", "agents", "base", "cdp", "x402", "ai"],
      heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero-image.png`,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Your AI DeFi Assistant on Base",
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || `${projectName} - DeFi Intelligence`,
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 
        "AI agents for token swaps, portfolio tracking, yield optimization, and market sentiment analysis",
      ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${URL}/og-image.png`,
      // use only while testing
      noindex: process.env.NODE_ENV !== 'production',
    }),
  });
}