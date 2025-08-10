# 🎯 Kill-FOMO MiniKit Integration Guide

## Overview

Kill-FOMO is now a fully-integrated Farcaster Mini App powered by MiniKit! This allows users to access our AI-powered DeFi agents directly within Farcaster, providing seamless trading, portfolio management, and market insights without leaving the social platform.

## 🚀 Features as a Mini App

### In-Frame Capabilities
- **Chat with AI Agents**: Interact with specialized DeFi agents directly in Farcaster
- **Quick Trading**: Execute swaps and trades without leaving the frame
- **Portfolio Tracking**: View your holdings and performance inline
- **Push Notifications**: Get alerts for price movements and opportunities
- **Social Trading**: Share trades and insights with other Farcaster users
- **One-Click Actions**: Quick buttons for common DeFi operations

### MiniKit Hooks Implemented

1. **`useMiniKit`**: Core frame context and readiness management
2. **`useNotification`**: Send push notifications for price alerts and trade confirmations
3. **`useAddFrame`**: Allow users to save Kill-FOMO to their Farcaster launcher
4. **`useOpenUrl`**: Link to detailed analytics and documentation
5. **`usePrimaryButton`**: Quick trade button for instant actions
6. **`useViewProfile`**: Navigate to user profiles for social features

## 📦 Installation & Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Required MiniKit Variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Kill-FOMO DeFi Agent
NEXT_PUBLIC_URL=https://your-app.vercel.app
NEXT_PUBLIC_CDP_API_KEY=your_cdp_api_key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_cdp_api_key

# Farcaster Association (Generated via CLI)
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=

# Optional Customization
NEXT_PUBLIC_APP_ICON=https://your-app.vercel.app/icon.png
NEXT_PUBLIC_APP_SUBTITLE=AI-Powered DeFi Agents on Base
NEXT_PUBLIC_APP_SPLASH_IMAGE=https://your-app.vercel.app/splash.png
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#1E293B
NEXT_PUBLIC_APP_HERO_IMAGE=https://your-app.vercel.app/hero.png
```

### 2. Generate Farcaster Manifest

Run the OnchainKit CLI to generate your account association:

```bash
npx create-onchain --manifest
```

**Important**: Connect your Farcaster custody wallet when prompted. You can find your recovery phrase in:
- Farcaster Settings → Advanced → Recovery phrase

### 3. Deploy Your App

Deploy to Vercel or your preferred hosting:

```bash
vercel deploy --prod
```

### 4. Test Your Mini App

1. **Validate Manifest**:
   ```
   https://farcaster.xyz/~/developers/mini-apps/manifest
   ```

2. **Create a Test Cast**:
   - Post your deployed URL in Farcaster
   - Verify the preview shows your hero image
   - Click "Launch Kill-FOMO" button

3. **Check Frame Context**:
   - The app should detect Farcaster context
   - User FID should be displayed
   - Frame-specific features should be enabled

## 🎨 UI/UX Optimizations for Frames

### Mobile-First Design
- Responsive layouts optimized for mobile viewing
- Touch-friendly buttons and interactions
- Simplified navigation for frame context

### Frame-Specific Features
- **Quick Actions Bar**: Common operations accessible with one tap
- **Compact Chat Interface**: Optimized for frame dimensions
- **Inline Results**: Show trading results without navigation
- **Social Integration**: Share trades directly to Farcaster feed

### Performance Optimizations
- Lazy loading of agent components
- Optimized asset delivery via CDN
- Minimal initial bundle for fast frame loading
- Progressive enhancement based on context

## 🔧 Technical Implementation

### Provider Setup
```tsx
// providers/MiniKitProvider.tsx
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';

export function MiniKitProvider({ children }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
      chain={base}
    >
      {children}
    </MiniKitProvider>
  );
}
```

### Frame Detection
```tsx
// Detect if running in Farcaster frame
const { context, isFrameReady } = useMiniKit();
const isFrameUser = !!context?.user?.fid;
```

### Notification Example
```tsx
// Send price alert notification
const { sendNotification } = useNotification();

sendNotification({
  title: 'Price Alert! 🚨',
  body: 'ETH has reached your target price of $4,000',
});
```

## 📊 Analytics & Monitoring

### Frame Analytics
Track these metrics for your Mini App:
- Frame launches per day
- User retention (added vs. active)
- Most used features in frame context
- Notification engagement rates
- Social sharing metrics

### Performance Metrics
- Frame load time: <2 seconds target
- Time to interactive: <3 seconds
- API response time: <500ms
- Notification delivery rate: >95%

## 🛠️ Troubleshooting

### Common Issues

1. **Frame Not Loading**
   - Check HTTPS is enabled
   - Verify manifest at `/.well-known/farcaster.json`
   - Ensure all environment variables are set

2. **Context Not Available**
   - Confirm MiniKitProvider is wrapping your app
   - Check that frame is launched from Farcaster
   - Verify account association is complete

3. **Notifications Not Working**
   - User must add frame first
   - Check notification permissions
   - Verify webhook URL is configured

## 🚀 Advanced Features

### CDP Integration in Frames
- **Smart Wallets**: Gasless transactions for frame users
- **Data API**: Real-time portfolio data in compact view
- **AgentKit**: Autonomous agent actions triggered from frame

### x402 Payment Gating
- Premium features accessible via micropayments
- Frame-specific pricing tiers
- Instant payment verification
- Revenue sharing with frame ecosystem

### Multi-Agent Orchestration
- Parallel agent execution for faster responses
- Context-aware agent selection
- Frame-optimized response formatting
- Social proof from other users' agent interactions

## 📱 Frame-Specific Agent Commands

### Quick Commands for Frame Users
```
"quick swap ETH to USDC"     → One-tap swap execution
"show my top 3 tokens"       → Compact portfolio view
"alert me if ETH > 4000"     → Push notification setup
"trending on Base"            → Inline trending tokens
"share my gains"              → Social sharing to feed
```

### Frame Actions
- **Primary Button**: Quick trade or most relevant action
- **Share Button**: Post results to Farcaster feed
- **Add Frame**: Save for quick launcher access
- **Settings**: Configure notifications and preferences

## 🔗 Resources

- [MiniKit Documentation](https://docs.cdp.coinbase.com/minikit)
- [Farcaster Frames Spec](https://docs.farcaster.xyz/reference/frames)
- [OnchainKit Reference](https://onchainkit.xyz)
- [Kill-FOMO GitHub](https://github.com/kamalbuilds/base-agents)

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] Farcaster manifest generated
- [ ] App deployed to HTTPS domain
- [ ] Manifest validation passed
- [ ] Frame preview working in casts
- [ ] Push notifications tested
- [ ] Primary button configured
- [ ] Analytics tracking enabled
- [ ] Error monitoring setup
- [ ] Performance benchmarks met

## 🎉 Launch Strategy

1. **Soft Launch**: Test with small group
2. **Gather Feedback**: Iterate on UX
3. **Marketing Cast**: Announce with demo video
4. **Engagement**: Respond to user feedback
5. **Iterate**: Add requested features

---

**Built with ❤️ for Farcaster | Powered by MiniKit & CDP**