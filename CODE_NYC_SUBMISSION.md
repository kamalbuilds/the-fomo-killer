# BasedAgents - Code NYC Hackathon Submission

## 🏆 Qualifying for All Three Bounty Tracks

BasedAgents is a sophisticated multi-agent system that qualifies for **all three Code NYC bounty tracks** with production-ready implementations:

### 1️⃣ Data-Driven Agents ($5,000 - $2,500 - $1,000)
✅ **Challenge**: Build AI agents or dashboards that react to real user activity using Coinbase's Data APIs

**Our Implementation**:
- **Real CDP Data API v2 Integration**: Uses actual Coinbase Data API for token balances and wallet history
- **DataDrivenAgent**: Specialized agent with real-time blockchain analysis capabilities
- **Production Tools**: Portfolio insights, risk assessment, DeFi position analysis, and automated alerts
- **Live Data Processing**: React to real wallet activity with intelligent recommendations

**Key Features**:
- Real-time token balance monitoring via CDP Data API
- Wallet transaction history analysis and pattern recognition  
- Portfolio performance metrics and diversification scoring
- DeFi yield opportunity identification
- Automated balance alerts and threshold monitoring
- Risk assessment and investment recommendations

**Technical Implementation**:
```typescript
// lib/agents/data-driven-agent.ts
// Real CDP Data API integration
const response = await axios.get(
  `${this.cdpDataApiBase}/token-balances/${address}`,
  {
    headers: {
      'Authorization': `Bearer ${await this.getCdpAccessToken()}`,
    },
  }
);
```

### 2️⃣ x402 + CDP Wallet ($5,000 - $2,500 - $1,000)  
✅ **Challenge**: Agents that earn using x402 for payment + Wallets/Onramp integration

**Our Implementation**:
- **x402 Protocol Integration**: Full implementation of x402 payment protocol
- **Revenue-Generating Endpoints**: Premium portfolio insights with payment gating
- **Smart Wallet Integration**: Coinbase Smart Wallets for frictionless UX
- **Blockchain Payment Validation**: Real transaction verification on Base network

**Key Features**:
- HTTP 402 Payment Required responses with proper x402 headers
- Premium portfolio analysis endpoint with payment gating ($1.00 USDC per request)
- Real blockchain transaction validation (ETH/USDC on Base)
- JWT and transaction hash payment verification
- Smart Wallet creation with gas sponsorship
- Batch transaction optimization for cost efficiency

**Technical Implementation**:
```typescript
// lib/x402/payment-middleware.ts
// x402 payment validation
private return402Response(): NextResponse {
  const response = NextResponse.json(
    { error: 'Payment required', price: { amount: this.config.priceUsdcCents } },
    { status: 402 }
  );
  response.headers.set('WWW-Authenticate', this.generateAuthHeader());
  return response;
}
```

### 3️⃣ Autonomous Worlds & Agents ($5,000 - $2,500 - $1,000)
✅ **Challenge**: Production-ready Web3 utility agent powered by AWESOME MCP workflows

**Our Implementation**:
- **Model Context Protocol (MCP) Server**: Full MCP integration for agent orchestration
- **Base Smart Contracts**: Integration with Base network and smart contracts
- **Production-Ready Agents**: Multi-agent system with real blockchain operations
- **MCP Tools & Resources**: Standardized agent interfaces for external integration

**Key Features**:
- Complete MCP server implementation with tools, resources, and prompts
- Agent orchestration via standardized MCP protocol
- Base network smart contract interactions via Coinbase AgentKit
- Cross-agent communication and composability
- External integration capabilities for other MCP clients
- Production-ready agent workflows with error handling

**Technical Implementation**:
```typescript
// lib/mcp/mcp-server.ts
// MCP server with agent tools
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  switch (name) {
    case 'analyze_portfolio':
      return await this.handlePortfolioAnalysis(args);
    case 'execute_trade':
      return await this.handleTradeExecution(args);
  }
});
```

## 🔧 Technical Architecture

### Multi-Agent System
- **MasterAgent**: Central orchestrator with intelligent routing
- **DataDrivenAgent**: CDP Data API integration for real-time analysis
- **TradingAgent**: DeFi operations with Coinbase AgentKit
- **UtilityAgent**: Event planning and payment utilities

### Infrastructure
- **Base Network**: Primary blockchain for all operations
- **Coinbase AgentKit v0.8.1**: Real blockchain operations
- **CDP SDK v2**: Smart Wallet and Data API integration
- **XMTP**: Secure decentralized messaging
- **Next.js**: Production web interface

### APIs & Integrations
- **CDP Data API v2**: Real-time blockchain data
- **x402 Protocol**: Payment infrastructure
- **Model Context Protocol**: Agent orchestration
- **Smart Wallets**: EIP-4337 account abstraction

## 🚀 Getting Started

### Prerequisites
```bash
# Required API Keys
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret  
CDP_WALLET_SECRET=your_cdp_wallet_secret
OPENAI_API_KEY=your_openai_api_key
```

### Installation & Demo
```bash
# Install dependencies
npm install

# Start the full Code NYC demo
npm run demo:code-nyc

# Start web interface
npm run dev

# Start MCP server
npm run mcp:server
```

## 🎯 Bounty Track Demonstrations

### Data-Driven Agents Demo
```bash
# Real-time portfolio analysis
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"message": "analyze portfolio for 0x742d35Cc0C4cA0D4B00a8bbD96E4e7eB80D56707", "agentType": "data-driven"}'
```

### x402 Revenue Demo  
```bash
# Check premium pricing
curl -X GET http://localhost:3000/api/premium-insights

# Access premium features (requires payment)
curl -X POST http://localhost:3000/api/premium-insights \
  -H "Content-Type: application/json" \
  -H "x402-payment: YOUR_TRANSACTION_HASH" \
  -d '{"addresses": ["0x742d35Cc0C4cA0D4B00a8bbD96E4e7eB80D56707"]}'
```

### Smart Wallet Demo
```bash
# Create frictionless wallet
curl -X POST http://localhost:3000/api/smart-wallet \
  -H "Content-Type: application/json" \
  -d '{"action": "get_or_create", "userId": "demo-user"}'

# Execute sponsored transaction
curl -X POST http://localhost:3000/api/smart-wallet \
  -H "Content-Type: application/json" \
  -d '{"action": "send_transaction", "userId": "demo-user", "to": "0x...", "value": "0.001"}'
```

## 💡 Innovation Highlights

### 1. Real Production Integration
- **No Mocks**: All integrations use real APIs and blockchain data
- **CDP Data API v2**: Actual Coinbase data infrastructure
- **Base Network**: Real smart contract interactions
- **x402 Protocol**: Genuine payment validation

### 2. Revenue Generation
- **Pay-per-Request**: Sustainable business model with x402
- **Premium Insights**: Value-added services behind paywall
- **Blockchain Validation**: Trustless payment verification
- **Flexible Pricing**: Configurable pricing per service

### 3. Frictionless UX
- **Smart Wallets**: No seed phrases required
- **Gas Sponsorship**: Users never pay gas fees
- **Batch Transactions**: Optimized multi-operation execution
- **Auto-funding**: Testnet wallets automatically funded

### 4. Agent Orchestration
- **MCP Standard**: Industry-standard agent communication
- **Composable Agents**: Mix and match capabilities
- **External Integration**: Works with any MCP client
- **Scalable Architecture**: Add new agents easily

## 📊 Business Model & Sustainability

### Revenue Streams
1. **Premium Analytics**: $1.00 per comprehensive portfolio analysis
2. **Real-time Monitoring**: Subscription-based alert systems  
3. **Trading Automation**: Fee-based automated trading services
4. **Custom Insights**: Enterprise-grade analysis packages

### Technology Moats
1. **Real-time Data**: Direct CDP API integration
2. **Multi-agent Intelligence**: Specialized agent capabilities
3. **Frictionless UX**: Smart Wallet onboarding
4. **Standards Compliance**: MCP and x402 protocols

## 🏗️ Code Structure

```
base-agent/
├── lib/
│   ├── agents/                 # Multi-agent system
│   │   ├── data-driven-agent.ts    # CDP Data API integration
│   │   ├── trading-agent.ts        # AgentKit & DeFi operations  
│   │   └── master-agent.ts         # Central orchestration
│   ├── x402/                   # Revenue generation
│   │   └── payment-middleware.ts   # x402 protocol implementation
│   ├── wallet/                 # Smart Wallet integration
│   │   └── smart-wallet-integration.ts
│   └── mcp/                    # Agent orchestration
│       └── mcp-server.ts           # MCP protocol server
├── app/api/                    # API endpoints
│   ├── premium-insights/           # x402-gated premium service
│   ├── smart-wallet/              # Wallet management
│   └── agents/                    # Agent communication
└── scripts/
    └── start-code-nyc-demo.ts     # Complete demo
```

## 🎖️ Why We Should Win

### Technical Excellence
- **Production-Ready**: No prototypes, all real integrations
- **Standards Compliance**: Implements x402, MCP, and EIP-4337
- **Scalable Architecture**: Modular, extensible agent system
- **Security-First**: Proper authentication and validation

### Business Viability  
- **Revenue Model**: Proven payment infrastructure
- **Market Need**: Real demand for blockchain analytics
- **Defensible Position**: Unique multi-agent capabilities
- **Growth Potential**: Expandable to new chains and services

### Innovation Impact
- **Industry Standards**: Pushing adoption of MCP and x402
- **User Experience**: Frictionless onchain interactions
- **Developer Tools**: Reusable agent framework
- **Ecosystem Growth**: Contributing to Base and Coinbase tools

## 🚀 Next Steps

### Immediate (Post-Hackathon)
- [ ] Production deployment on Base mainnet
- [ ] Enterprise customer onboarding
- [ ] Additional agent specializations
- [ ] Mobile app development

### Medium-term (3-6 months)
- [ ] Multi-chain expansion (Ethereum, Polygon)
- [ ] Advanced ML models for predictions
- [ ] Social trading features
- [ ] API marketplace for third-party agents

### Long-term (6+ months)
- [ ] Decentralized agent network
- [ ] Token incentive mechanisms
- [ ] Cross-protocol integrations
- [ ] Autonomous agent DAOs

---

**Built with ❤️ for Code NYC 2025**  
**Qualifying for all three bounty tracks with production-ready code**

🌐 **Demo**: [https://basedagents.xyz](https://basedagents.xyz)  
📚 **Docs**: [README.md](./README.md)  
🔗 **GitHub**: [Repository](https://github.com/kamalbuilds/base-agents)  
💬 **Contact**: [Discord](https://discord.gg/base-agents)