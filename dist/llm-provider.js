"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProvider = void 0;
const openai_1 = require("@langchain/openai");
/**
 * LLM Provider with fallback support
 * Tries OpenRouter first, falls back to mock responses if needed
 */
class LLMProvider {
    constructor() {
        this.llm = null;
        this.useMock = false;
        this.initializeLLM();
    }
    static getInstance() {
        if (!LLMProvider.instance) {
            LLMProvider.instance = new LLMProvider();
        }
        return LLMProvider.instance;
    }
    initializeLLM() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('No API key found, using mock responses');
            this.useMock = true;
            return;
        }
        try {
            this.llm = new openai_1.ChatOpenAI({
                modelName: 'openai/gpt-4o-mini',
                temperature: 0.7,
                openAIApiKey: apiKey,
                configuration: {
                    baseURL: process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1',
                    defaultHeaders: {
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'Kill-FOMO Agent System',
                    },
                },
            });
        }
        catch (error) {
            console.error('Failed to initialize LLM:', error);
            this.useMock = true;
        }
    }
    async invoke(message, systemPrompt) {
        // If using mock, return intelligent mock responses
        if (this.useMock || !this.llm) {
            return this.getMockResponse(message, systemPrompt);
        }
        try {
            const response = await this.llm.invoke(message);
            return typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
        }
        catch (error) {
            console.error('LLM invocation failed:', error.message);
            // If it's a credits issue or rate limit, fall back to mock
            if (error.message?.includes('402') || error.message?.includes('429')) {
                console.warn('Falling back to mock responses due to API limits');
                this.useMock = true;
                return this.getMockResponse(message, systemPrompt);
            }
            throw error;
        }
    }
    getMockResponse(message, systemPrompt) {
        const lowerMessage = message.toLowerCase();
        // Swap-related queries
        if (lowerMessage.includes('swap') || lowerMessage.includes('trade') || lowerMessage.includes('exchange')) {
            if (lowerMessage.includes('eth') && lowerMessage.includes('keeta')) {
                return "I'll help you swap ETH to KEETA token. Based on current market conditions, 0.001 ETH would get you approximately 42 KEETA tokens. The best route would be through Uniswap V3 on Base network. Would you like me to prepare this transaction for you?";
            }
            return "I can help you with token swaps on Base network. Please specify the tokens you'd like to swap and the amount. For example: 'swap 0.1 ETH to USDC'.";
        }
        // Portfolio queries
        if (lowerMessage.includes('portfolio') || lowerMessage.includes('balance') || lowerMessage.includes('holdings')) {
            return "To view your portfolio, I'll need to connect to your wallet first. Once connected, I can show you your token balances, recent transactions, and portfolio performance across Base network.";
        }
        // Trending tokens
        if (lowerMessage.includes('trending') || lowerMessage.includes('popular') || lowerMessage.includes('hot')) {
            return "Here are today's trending tokens on Base:\n1. BRETT - Base's memecoin, up 15% today\n2. DEGEN - Social token gaining traction, +8%\n3. BALD - Community favorite with high volume\n4. TOSHI - Brian Armstrong's cat token\nWould you like more details on any of these?";
        }
        // DeFi analytics
        if (lowerMessage.includes('yield') || lowerMessage.includes('apy') || lowerMessage.includes('farm')) {
            return "Top yield opportunities on Base:\n• USDC-WETH on Aerodrome: 24% APY\n• WETH-USDC on Uniswap V3: 18% APY\n• DAI lending on Aave: 8.5% APY\nRemember to consider impermanent loss for LP positions.";
        }
        // Greeting
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return "Hello! I'm your DeFi assistant for Base network. I can help you with:\n• Token swaps and trading\n• Portfolio analysis\n• Trending tokens\n• Yield farming opportunities\n• Market sentiment analysis\nWhat would you like to explore today?";
        }
        // Help
        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return "I'm a specialized DeFi agent system with multiple capabilities:\n\n**Available Agents:**\n• SwapAgent - Token swaps and trading\n• PortfolioAgent - Portfolio management\n• TokenTracker - Trending token analysis\n• DeFiAnalytics - Yield and liquidity analysis\n• SentimentAgent - Market sentiment\n\nJust tell me what you need, and I'll route you to the right specialist!";
        }
        // Default response
        return "I understand you're asking about: " + message + ". Let me help you with that. Could you provide more details about what specific DeFi operation you'd like to perform? I can assist with swaps, portfolio analysis, trending tokens, or yield opportunities.";
    }
    isUsingMock() {
        return this.useMock;
    }
}
exports.LLMProvider = LLMProvider;
