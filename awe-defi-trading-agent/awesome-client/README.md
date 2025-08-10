# AWESOME MCP Platform

## What is MCP?

[MCP](https://modelcontextprotocol.io/docs/getting-started/intro) is an open protocol that standardizes how applications provide context to LLMs. Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools.

[MCP Overview](https://modelcontextprotocol.io/overview)  
[Dev Roadmap](https://modelcontextprotocol.io/development/roadmap)

## What is AWESOME MCP Platform?

Together, these unlock a complete environment for worldbuilders, AI engineers, and creators to experiment, deploy, and scale autonomous systems — powered entirely by on-chain incentives.

[AWESOME MCP](https://www.awenetwork.ai/blog/awesome)

## How does AWESOME work?

[MCP Workflow Builder](https://www.awenetwork.ai/blog/introducing-awesome-beta)

[Agent Marketplace](https://www.awenetwork.ai/blog/agent-marketplace)

## Featured Use Case

[AWESOME_X_Agent](https://x.com/awenetwork_ai/status/1952190887410417993)

## Project Introduction

This project is a front-end application built on the [Next.js](https://nextjs.org/) framework, aimed at showcasing and providing an MCP tool platform that supports efficient interaction with the backend. The project integrates various cutting-edge technologies and features, committed to offering users a secure, convenient, and intelligent MCP experience. Key features include:

🔐 **Wallet Login** - Supports EIP-4361 "Sign-In with Ethereum" standard for seamless blockchain-based authentication.  
🤖 **AI Chat** - Integrated with OpenAI GPT and other LLMs for intelligent conversation and content generation.  
🎯 **Intelligent Agent** - Provides dedicated multi-turn conversations and task execution, capable of dynamic decision-making based on user needs.  
👤 **User Management** - Complete user profile management, including avatar, membership levels, and more.  
💳 **Crypto Payment** - Integrated with Coinbase Commerce to support USDT/USDC payments for simplified cryptocurrency transactions.  
👑 **Membership System** - Provides Plus/Pro subscription management, meeting the needs of different users.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) - A high-performance React framework for building SSR and SSG web applications that optimize page load speed and SEO.  
- **UI Component Library**: [Chakra UI](https://chakra-ui.com/) - A modern, accessible, and customizable React component library for building consistent and reusable UI components.  
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) - A modern Redux library for efficient global state management, ensuring data synchronization and consistency across components.  
- **Web3 Interaction**: [Wagmi](https://wagmi.sh/), [Ethers.js](https://docs.ethers.io/v5/) - Libraries for interacting with Ethereum and other blockchain networks, enabling wallet connections, signing transactions, and more.  
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for building highly customized responsive UIs quickly.  
- **Animations**: [Framer Motion](https://www.framer.com/motion/) - A powerful animation library for building smooth UI transitions and interactions to enhance user experience.  
- **AI Conversations**: [OpenAI GPT](https://openai.com/) - Integration of GPT models for real-time conversational interactions with dynamic chat layouts rendered on the frontend.  
- **Security**: [JWT](https://jwt.io/) - JSON Web Tokens used for secure authentication, ensuring app security and encrypted data protection.  
- **Crypto Payments**: [Coinbase Commerce](https://commerce.coinbase.com/) - Integrated with Coinbase Commerce for cryptocurrency payments, supporting USDT, USDC, and other payment methods.

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MCP3-io/mcp-client
cd mcp-client
```



### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Environment
```bash
npm run dev
```

Open your browser and go to http://localhost:3000 to view the app.

## Project Structure
```
├── /components            # React components
│ └── ...  
├── /pages                 # Next.js pages
│ └── ...  
├── /public                # Static assets like images, fonts, etc.
│ └── ...  
├── /styles                # Styles and Tailwind configuration
│ └── ...  
├── /store                 # Redux state management files
│ └── ...  
├── /assets                # Static resources like images
│ └── ...  
├── /hooks                 # Custom hooks
│ └── ...  
├── /config                # Common configuration files
│ └── ...  
├── /api                   # API interfaces
│ └── ...  
└── /utils                 # Utility functions
└── ...  

```

## Build and Deploy
### 1. Build for Development
```bash
npm run build:dev
```
This command will build the code for the development environment.

### 2.  Build for Production
```bash
npm run build:prod
```
This command will build the code for the production environment, optimizing performance and resources.


## Environment Variables
### Set the following environment variables for local development and deployment:
```bash
NEXT_PUBLIC_API_URL：API 服务器的 URL，区分测试环境和生产环境。
```

### Set Environment Variables
#### 1. in the .env.development file, add the following

```bash
NEXT_PUBLIC_API_URL=https://api-test.awenetwork.ai
```

#### 2. in the .env.production file, add the following

```bash
NEXT_PUBLIC_API_URL=https://api.awenetwork.ai
```
