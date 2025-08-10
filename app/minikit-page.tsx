'use client';

import { useEffect, useState } from 'react';
import { 
  useMiniKit, 
  useNotification,
  useAddFrame,
  useOpenUrl,
  usePrimaryButton,
  useViewProfile 
} from '@coinbase/onchainkit/minikit';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { SystemStatus } from '@/components/system/SystemStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, MessageSquare, Wallet, TrendingUp, Shield, Zap } from 'lucide-react';

export default function MiniKitPage() {
  const { 
    setFrameReady, 
    isFrameReady, 
    context 
  } = useMiniKit();
  
  const { sendNotification } = useNotification();
  const { addFrame } = useAddFrame();
  const { openUrl } = useOpenUrl();
  const { setPrimaryButton, removePrimaryButton } = usePrimaryButton();
  const { viewProfile } = useViewProfile();

  const [activeTab, setActiveTab] = useState('chat');
  const [isFrameUser, setIsFrameUser] = useState(false);

  // Initialize frame when component mounts
  useEffect(() => {
    if (!isFrameReady) {
      // Simulate loading your app resources
      setTimeout(() => {
        setFrameReady();
      }, 1000);
    }
  }, [setFrameReady, isFrameReady]);

  // Check if user is in Farcaster frame context
  useEffect(() => {
    if (context?.user?.fid) {
      setIsFrameUser(true);
      console.log('Farcaster user detected:', context.user.fid);
      
      // Send welcome notification if first time
      if (!context.client?.added) {
        sendNotification({
          title: 'Welcome to Kill-FOMO!',
          body: 'Your AI DeFi assistant is ready. Add this frame for quick access to trading insights.',
        });
      }
    }
  }, [context, sendNotification]);

  // Setup primary button for quick actions
  useEffect(() => {
    if (isFrameUser && activeTab === 'chat') {
      setPrimaryButton({
        text: '💬 Quick Trade',
        onClick: () => {
          // Trigger quick trade modal or action
          console.log('Quick trade triggered');
        },
      });
    } else {
      removePrimaryButton();
    }
    
    return () => removePrimaryButton();
  }, [isFrameUser, activeTab, setPrimaryButton, removePrimaryButton]);

  const handleAddFrame = async () => {
    try {
      await addFrame();
      sendNotification({
        title: 'Frame Added!',
        body: 'Kill-FOMO has been added to your Farcaster client.',
      });
    } catch (error) {
      console.error('Error adding frame:', error);
    }
  };

  const handleViewDocs = () => {
    openUrl('https://github.com/kamalbuilds/base-agents');
  };

  const handleViewProfile = () => {
    if (context?.user?.fid) {
      viewProfile({ fid: context.user.fid });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* MiniKit Frame Header */}
      {isFrameUser && (
        <div className="bg-blue-600/20 border-b border-blue-500/30 p-3">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-sm">
                Connected via Farcaster (FID: {context?.user?.fid})
              </span>
            </div>
            <div className="flex gap-2">
              {!context?.client?.added && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddFrame}
                  className="text-xs"
                >
                  Add Frame
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleViewProfile}
                className="text-xs"
              >
                Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Kill-FOMO
                </h1>
                <p className="text-xs text-slate-400">AI DeFi Agents on Base</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewDocs}
                className="hidden sm:flex"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Docs
              </Button>
              <SystemStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Feature Cards for Frame Context */}
      {isFrameUser && activeTab === 'home' && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Trending Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  Real-time trending tokens with alpha signals
                </p>
                <Button 
                  className="mt-3 w-full" 
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                >
                  View Trends
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  Track and optimize your DeFi positions
                </p>
                <Button 
                  className="mt-3 w-full" 
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                >
                  Analyze
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  Quick Swap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  Instant token swaps with best rates
                </p>
                <Button 
                  className="mt-3 w-full" 
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                >
                  Swap Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="home" className="data-[state=active]:bg-slate-700">
              Home
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-slate-700">
              Chat
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-slate-700">
              Agents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            {!isFrameUser && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>Welcome to Kill-FOMO Mini App</CardTitle>
                  <CardDescription>
                    Access this app through Farcaster for the best experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-4">
                    Launch this mini app from a Farcaster cast to unlock:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>✅ One-click trading without leaving Farcaster</li>
                    <li>✅ Push notifications for price alerts</li>
                    <li>✅ Quick access from your Farcaster launcher</li>
                    <li>✅ Social trading features with other users</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'SwapAgent', status: 'active', description: 'Token swaps & arbitrage' },
                { name: 'PortfolioAgent', status: 'active', description: 'Portfolio tracking' },
                { name: 'TokenTracker', status: 'active', description: 'Trending tokens & signals' },
                { name: 'DeFiAnalytics', status: 'active', description: 'Yield optimization' },
                { name: 'SentimentAgent', status: 'active', description: 'Market sentiment' },
                { name: 'DataDrivenAgent', status: 'premium', description: 'CDP Data insights' },
              ].map((agent) => (
                <Card key={agent.name} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${
                        agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Frame-specific Footer */}
      {isFrameUser && (
        <footer className="border-t border-slate-700 bg-slate-900/50 mt-12">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Powered by CDP & MiniKit</span>
              <span>Location: {context?.location || 'Unknown'}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}