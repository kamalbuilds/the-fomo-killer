import { Router, Request, Response } from 'express';
import { DeFiTradingAgent } from '../services/defiTradingAgent.js';
import { auth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Store active trading agents
const activeAgents = new Map<string, DeFiTradingAgent>();

// Initialize trading agent for user
router.post('/init', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { privateKey, mcpServices, strategies, riskLimit } = req.body;

    // Check if agent already exists
    if (activeAgents.has(userId)) {
      return res.status(400).json({ 
        error: 'Trading agent already active for this user' 
      });
    }

    // Create and initialize agent
    const agent = new DeFiTradingAgent(userId, {
      rpcUrl: process.env.BASE_RPC_URL || 'https://base.publicnode.com',
      privateKey,
      mcpServices: mcpServices || ['playwright', 'coinbase', 'web-browser'],
      maxPositions: 5,
      riskLimit: riskLimit || 0.2 // 20% default risk limit
    });

    await agent.initialize();
    activeAgents.set(userId, agent);

    // Start monitoring positions
    setInterval(() => agent.monitorPositions(), 60000); // Every minute

    res.json({
      success: true,
      message: 'Trading agent initialized successfully',
      status: await agent.getPortfolioStatus()
    });
  } catch (error) {
    logger.error('Failed to initialize trading agent', error);
    res.status(500).json({ 
      error: 'Failed to initialize trading agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analyze market for a specific token
router.post('/analyze', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tokenAddress } = req.body;

    const agent = activeAgents.get(userId);
    if (!agent) {
      return res.status(404).json({ 
        error: 'No active trading agent found' 
      });
    }

    const signal = await agent.analyzeMarket(tokenAddress);

    res.json({
      success: true,
      signal,
      recommendation: getTradeRecommendation(signal)
    });
  } catch (error) {
    logger.error('Market analysis failed', error);
    res.status(500).json({ 
      error: 'Market analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute a trade
router.post('/trade', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { strategy, tokenAddress, amount, action } = req.body;

    const agent = activeAgents.get(userId);
    if (!agent) {
      return res.status(404).json({ 
        error: 'No active trading agent found' 
      });
    }

    const result = await agent.executeTrade(
      strategy,
      tokenAddress,
      amount,
      action
    );

    res.json({
      success: true,
      trade: result,
      portfolio: await agent.getPortfolioStatus()
    });
  } catch (error) {
    logger.error('Trade execution failed', error);
    res.status(500).json({ 
      error: 'Trade execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get portfolio status
router.get('/portfolio', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const agent = activeAgents.get(userId);
    if (!agent) {
      return res.status(404).json({ 
        error: 'No active trading agent found' 
      });
    }

    const status = await agent.getPortfolioStatus();
    res.json(status);
  } catch (error) {
    logger.error('Failed to get portfolio status', error);
    res.status(500).json({ 
      error: 'Failed to get portfolio status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop trading agent
router.post('/stop', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const agent = activeAgents.get(userId);
    if (!agent) {
      return res.status(404).json({ 
        error: 'No active trading agent found' 
      });
    }

    await agent.stop();
    activeAgents.delete(userId);

    res.json({
      success: true,
      message: 'Trading agent stopped successfully'
    });
  } catch (error) {
    logger.error('Failed to stop trading agent', error);
    res.status(500).json({ 
      error: 'Failed to stop trading agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch analyze multiple tokens
router.post('/analyze-batch', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tokens } = req.body;

    const agent = activeAgents.get(userId);
    if (!agent) {
      return res.status(404).json({ 
        error: 'No active trading agent found' 
      });
    }

    const signals = await Promise.all(
      tokens.map((token: string) => agent.analyzeMarket(token))
    );

    const opportunities = signals
      .filter(s => s.type !== 'hold' && s.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence);

    res.json({
      success: true,
      signals,
      opportunities,
      topPick: opportunities[0] || null
    });
  } catch (error) {
    logger.error('Batch analysis failed', error);
    res.status(500).json({ 
      error: 'Batch analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available strategies
router.get('/strategies', auth, async (_req: Request, res: Response) => {
  res.json({
    strategies: [
      {
        id: 'momentum',
        name: 'Momentum Trading',
        description: 'Follows strong price trends with technical indicators',
        riskLevel: 'medium',
        minBalance: 100,
        targetReturn: '15%'
      },
      {
        id: 'arbitrage',
        name: 'DEX Arbitrage',
        description: 'Exploits price differences across DEXs',
        riskLevel: 'low',
        minBalance: 500,
        targetReturn: '5%'
      },
      {
        id: 'yield-farming',
        name: 'Yield Optimization',
        description: 'Maximizes returns through liquidity provision',
        riskLevel: 'high',
        minBalance: 1000,
        targetReturn: '30%'
      },
      {
        id: 'grid-trading',
        name: 'Grid Trading',
        description: 'Places multiple orders at different price levels',
        riskLevel: 'low',
        minBalance: 200,
        targetReturn: '10%'
      }
    ]
  });
});

// Helper function for trade recommendations
function getTradeRecommendation(signal: any): string {
  if (signal.type === 'buy' && signal.confidence > 0.8) {
    return 'Strong buy signal - Consider entering position';
  } else if (signal.type === 'buy' && signal.confidence > 0.6) {
    return 'Moderate buy signal - Consider small position';
  } else if (signal.type === 'sell' && signal.confidence > 0.8) {
    return 'Strong sell signal - Consider exiting position';
  } else if (signal.type === 'sell' && signal.confidence > 0.6) {
    return 'Moderate sell signal - Consider reducing position';
  } else {
    return 'Hold - No clear signal, wait for better opportunity';
  }
}

export default router;