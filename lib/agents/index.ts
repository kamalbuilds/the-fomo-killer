export { BaseAgent } from './base-agent';
export { TokenTrackerAgent } from './token-tracker-agent';
export { SwapAgent } from './swap-agent';
export { PortfolioAgent } from './portfolio-agent';
export { DeFiAnalyticsAgent } from './defi-analytics-agent';

import { TokenTrackerAgent } from './token-tracker-agent';
import { SwapAgent } from './swap-agent';
import { SentimentAgent } from './sentiment-agent';
import { PortfolioAgent } from './portfolio-agent';
import { DeFiAnalyticsAgent } from './defi-analytics-agent';
import { BaseAgent } from './base-agent';

export type AgentType = 'token-tracker' | 'swap-agent' | 'sentiment' | 'portfolio' | 'defi-analytics' | 'master';

export class AgentFactory {
  private static agents: Map<AgentType, BaseAgent> = new Map();

  static createAgent(type: AgentType): BaseAgent {
    // Check if agent already exists
    const existingAgent = this.agents.get(type);
    if (existingAgent) {
      return existingAgent;
    }

    let agent: BaseAgent;

    switch (type) {
      case 'token-tracker':
        agent = new TokenTrackerAgent();
        break;
      case 'swap-agent':
        agent = new SwapAgent();
        break;
      case 'sentiment':
        agent = new SentimentAgent();
        break;
      case 'portfolio':
        agent = new PortfolioAgent();
        break;
      case 'defi-analytics':
        agent = new DeFiAnalyticsAgent();
        break;
      case 'master':
        // Master agent will coordinate other agents
        agent = new MasterAgent();
        break;
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }

    this.agents.set(type, agent);
    return agent;
  }

  static getAgent(type: AgentType): BaseAgent | undefined {
    return this.agents.get(type);
  }

  static getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  static clearAgents(): void {
    this.agents.clear();
  }
}

// Master Agent to coordinate DeFi agents
export class MasterAgent extends BaseAgent {
  private tokenTracker: TokenTrackerAgent;
  private swapAgent: SwapAgent;
  private sentimentAgent: SentimentAgent;
  private portfolioAgent: PortfolioAgent;
  private defiAnalytics: DeFiAnalyticsAgent;

  constructor() {
    super('MasterAgent');
    this.tokenTracker = new TokenTrackerAgent();
    this.swapAgent = new SwapAgent();
    this.sentimentAgent = new SentimentAgent();
    this.portfolioAgent = new PortfolioAgent();
    this.defiAnalytics = new DeFiAnalyticsAgent();
  }

  async processMessage(message: string, context: any): Promise<any> {
    this.logger.info(`Processing message with MasterAgent: ${message}`);
    
    try {
      // Analyze message to determine which agent(s) to use
      const intent = this.analyzeIntent(message);
      
      switch (intent.primary) {
        case 'swap':
        case 'trade':
        case 'exchange':
          return await this.swapAgent.processMessage(message, context);
          
        case 'track':
        case 'trending':
        case 'tokens':
          return await this.tokenTracker.processMessage(message, context);
          
        case 'sentiment':
        case 'news':
        case 'social':
          return await this.sentimentAgent.processMessage(message, context);
          
        case 'portfolio':
        case 'holdings':
        case 'balance':
          return await this.portfolioAgent.processMessage(message, context);
          
        case 'analytics':
        case 'yield':
        case 'liquidity':
          return await this.defiAnalytics.processMessage(message, context);
          
        case 'multi':
          return await this.handleMultiAgentRequest(message, context, intent.agents);
          
        default:
          return await this.handleGeneralRequest(message, context);
      }
    } catch (error) {
      this.logger.error('Error in MasterAgent:', error);
      return {
        message: 'I encountered an error processing your request. Please try again.',
        actions: [],
        context: {}
      };
    }
  }

  private analyzeIntent(message: string): any {
    const lower = message.toLowerCase();
    
    // Check for multi-agent requests
    const agentMentions: string[] = [];
    
    if (lower.includes('swap') || lower.includes('trade') || lower.includes('exchange')) {
      agentMentions.push('swap');
    }
    if (lower.includes('track') || lower.includes('trending') || lower.includes('hot')) {
      agentMentions.push('track');
    }
    if (lower.includes('sentiment') || lower.includes('news') || lower.includes('social')) {
      agentMentions.push('sentiment');
    }
    if (lower.includes('portfolio') || lower.includes('holdings') || lower.includes('balance')) {
      agentMentions.push('portfolio');
    }
    if (lower.includes('yield') || lower.includes('farm') || lower.includes('liquidity')) {
      agentMentions.push('analytics');
    }
    
    if (agentMentions.length > 1) {
      return { primary: 'multi', agents: agentMentions };
    } else if (agentMentions.length === 1) {
      return { primary: agentMentions[0], agents: agentMentions };
    }
    
    // Default intents based on keywords
    if (lower.includes('what') || lower.includes('how') || lower.includes('help')) {
      return { primary: 'help', agents: [] };
    }
    
    return { primary: 'general', agents: [] };
  }

  private async handleMultiAgentRequest(message: string, context: any, agents: string[]): Promise<any> {
    this.logger.info(`Coordinating multiple agents: ${agents.join(', ')}`);
    
    const responses = await Promise.all(
      agents.map(async agent => {
        switch (agent) {
          case 'swap':
            return await this.swapAgent.processMessage(message, context);
          case 'track':
            return await this.tokenTracker.processMessage(message, context);
          case 'sentiment':
            return await this.sentimentAgent.processMessage(message, context);
          case 'portfolio':
            return await this.portfolioAgent.processMessage(message, context);
          case 'analytics':
            return await this.defiAnalytics.processMessage(message, context);
          default:
            return null;
        }
      })
    );
    
    // Combine responses
    const combinedMessage = responses
      .filter(r => r !== null)
      .map(r => r.message)
      .join('\n\n---\n\n');
    
    const combinedActions = responses
      .filter(r => r !== null)
      .flatMap(r => r.actions);
    
    return {
      message: `I've consulted multiple agents for a comprehensive analysis:\n\n${combinedMessage}`,
      actions: combinedActions,
      context: { multiAgent: true, responses }
    };
  }

  private async handleGeneralRequest(message: string, context: any): Promise<any> {
    return {
      message: `I'm the MasterAgent coordinating DeFi operations. I can help you with:
      
🔄 **Token Swapping** - Best rates, arbitrage opportunities
📊 **Token Tracking** - Trending tokens, wallet analysis
📰 **Sentiment Analysis** - News, social media trends
💼 **Portfolio Management** - Holdings, risk, rebalancing
🔬 **DeFi Analytics** - Yields, liquidity, market trends

What would you like to explore?`,
      actions: [
        {
          type: 'select_agent',
          label: 'Token Swapping',
          data: { agent: 'swap' }
        },
        {
          type: 'select_agent',
          label: 'Track Tokens',
          data: { agent: 'track' }
        },
        {
          type: 'select_agent',
          label: 'Check Sentiment',
          data: { agent: 'sentiment' }
        },
        {
          type: 'select_agent',
          label: 'Portfolio Analysis',
          data: { agent: 'portfolio' }
        },
        {
          type: 'select_agent',
          label: 'DeFi Analytics',
          data: { agent: 'analytics' }
        }
      ],
      context: {}
    };
  }
}