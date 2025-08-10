

export const MCPList = [
    {
        categoryName: 'LLM',
        mcps: [

        ]
    },
    {
        categoryName: 'Chain PRC',
        mcps: [
             {
                name: 'base-mcp',
                description: 'A Model Context Protocol (MCP) server that provides onchain tools for LLMs, allowing them to interact with the Base network and Coinbase API.',
                command: 'node',
                args: [ process.env.VITE_RESOLEV_PATH + 'base-mcp/build/index.js'],
                env: {
                    COINBASE_API_KEY_NAME:  process.env.VITE_COINBASE_API_KEY_NAME || '',
                    COINBASE_API_PRIVATE_KEY:  process.env.VITE_COINBASE_API_PRIVATE_KEY || '',
                    SEED_PHRASE:  process.env.VITE_SEED_PHRASE || '',
                    COINBASE_PROJECT_ID:  process.env.VITE_COINBASE_PROJECT_ID || '',
                    ALCHEMY_API_KEY:  process.env.VITE_ALCHEMY_API_KEY || '',
                    OPENROUTER_API_KEY:  process.env.VITE_OPENROUTER_API_KEY || '',
                    CHAIN_ID:  process.env.VITE_CHAIN_ID || '',
                    // NEYNAR_API_KEY: ''
                },
                connected: false,
                githubUrl: 'https://github.com/base/base-mcp',
                logo: 'https://avatars.githubusercontent.com/u/16627100?s=48&v=4'
            },
            {
                name: 'evm-mcp-server',
                description: 'Model Context Protocol (MCP) server for interacting with EVM-compatible networks.',
                command: 'npx',
                args: [ "-y", "@mcpdotdirect/evm-mcp-server"],
                env: {
                
                },
                connected: false,
                githubUrl: 'https://github.com/mcpdotdirect/evm-mcp-server',
                logo: 'https://avatars.githubusercontent.com/u/6250754?s=48&v=4'
            },
        ]
    },
    {
        categoryName: 'Market Data',
        mcps: [
             {
                name: 'Dexscreener',
                description: 'get access to onchain crypto markets on almost any blockchain, best for solana memecoins price api',
                command: 'node',
                args: [ process.env.VITE_RESOLEV_PATH + 'dexscreener-mcp-server/build/index.js'],
                env: {},
                connected: false,
                githubUrl: 'https://github.com/openSVM/dexscreener-mcp-server',
                logo: 'https://avatars.githubusercontent.com/u/99915600?s=48&v=4'
            },
            {
                name: 'Coingecko',
                description: 'A Model Context Protocol (MCP) server and OpenAI function calling service for interacting with the CoinGecko Pro API.',
                command: 'node',
                args: [ process.env.VITE_RESOLEV_PATH + "coingecko-server/build/index.js"],
                env: {
                    COINGECKO_API_KEY:  process.env.VITE_COINGECKO_API_KEY || ''
                },
                connected: false,
                githubUrl: 'https://github.com/crazyrabbitLTC/mcp-coingecko-server',
                logo: 'https://avatars.githubusercontent.com/u/7111837?s=48&v=4'
            },
            {
                name: 'CoinmarketCap',
                description: 'MCP Implementation for CoinMarketCap.',
                command: 'npx',
                args: ['@shinzolabs/coinmarketcap-mcp'],
                env: {
                    "COINMARKETCAP_API_KEY":  process.env.VITE_COINMARKETCAP_API_KEY,
                    "SUBSCRIPTION_LEVEL": "Basic",
                    "PORT": "3002", // 确保该端口不被占用
                },
                connected: false,
                githubUrl: 'https://github.com/shinzo-labs/coinmarketcap-mcp',
                logo: 'https://play-lh.googleusercontent.com/kCKeckQNFF9P2470x4lF9v3OW_ZZtvk1SIo9RmvJDa6WtBboqfzyefEZ2_rwWRYgM_M'
            },
            {
                name: 'DefiLlama',
                description: 'This repository contains a Model Context Protocol (MCP) server that provides Claude with access to DeFi data via the DefiLlama API. The server enables Claude to perform operations like retrieving protocol TVL data, chain TVL data, token prices, and stablecoin information.',
                command: 'node',
                args: [
                    `${ process.env.VITE_RESOLEV_PATH}mcp-server-defillama/dist/index.js`,
                ],
                env: {
                    
                },
                connected: false,
                githubUrl: 'https://github.com/dcSpark/mcp-server-defillama',
                logo: 'https://avatars.githubusercontent.com/u/75200801?s=48&v=4'
            },              
            {
                name: 'Dune',
                description: 'A Model Context Protocol (MCP) server that bridges Dune Analytics data to AI agents, providing access to DEX metrics, EigenLayer operators and AVS stats, and token balances on Solana. The tools utilize the preset endpoints and echo endpoints provided by Dune.',
                command: 'bun',
                args: [
                    process.env.VITE_RESOLEV_PATH + "dune-mcp-server/dist/index.js",
                    "stdio"
                ],
                env: {
                    DUNE_API_KEY: process.env.VITE_DUNE_API_KEY
                },
                connected: false,
                githubUrl: 'https://github.com/ekailabs/dune-mcp-server',
                logo: 'https://avatars.githubusercontent.com/u/7131646?s=48&v=4'
            },

            {
                name: 'Chainlink',
                description: `An MCP server that provides real-time access to Chainlink's decentralized on-chain price feeds.`,
                command: 'node',
                args: [ process.env.VITE_RESOLEV_PATH + 'chainlink-feeds-mcp/index.js'],
                env: {
                    "INFURA_API_KEY": process.env.VITE_UNISWAP_INFURA_KEY
                },
                connected: false,
                githubUrl: 'https://github.com/kukapay/chainlink-feeds-mcp',
                logo: 'https://avatars.githubusercontent.com/u/25111032?s=48&v=4'
            },


        ]
    },
    {
        categoryName: 'Dev Tool',
        mcps: [
            {
                name: 'Github',
                description: `GitHub's official MCP Server`,
                command: 'docker',
                args: [
                    "run",
                    "-i",
                    "--rm",
                    "-e",
                    "GITHUB_PERSONAL_ACCESS_TOKEN",
                    "ghcr.io/github/github-mcp-server"
                ],
                env: {
                    GITHUB_PERSONAL_ACCESS_TOKEN:  process.env.VITE_GITHUB_PERSONAL_ACCESS_TOKEN || ''
                },
                connected: false,
                githubUrl: 'https://github.com/github/github-mcp-server',
                logo: 'https://avatars.githubusercontent.com/u/9919?s=48&v=4'
            },  
            {
                name: 'Playwright',
                description: 'Playwright Tools for MCP.',
                command: 'npx',
                args: ['@playwright/mcp@latest'],
                env: {
                    
                },
                connected: false,
                githubUrl: 'https://github.com/microsoft/playwright-mcp',
                logo: 'https://avatars.githubusercontent.com/u/6154722?s=48&v=4'
            },
            {
                name: 'Unreal',
                description: 'This project enables AI assistant clients like Cursor, Windsurf and Claude Desktop to control Unreal Engine through natural language using the Model Context Protocol (MCP).',
                command: 'uv',
                args: [
                    "--directory",
                    "/Users/liujiantao/Desktop/Remote/mcp/mcps/unreal-mcp/Python",
                    "run",
                    "unreal_mcp_server.py"
                ],
                env: {},
                connected: false,
                githubUrl: 'https://github.com/chongdashu/unreal-mcp',
                logo: 'https://bairesdev.mo.cloudinary.net/blog/2022/08/ue-logo-1400x788-1400x788-8f185e1e3635-1.jpg?tx=w_1920,q_auto'
            },
            {
                name: 'Figma',
                description: 'MCP server to provide Figma layout information to AI coding agents like Cursor.',
                command: 'npx',
                args: ["-y", "figma-developer-mcp", `--figma-api-key=${ process.env.VITE_FIGMA_API_KEY || ''}`, "--stdio"],
                env: {
                    
                },
                connected: false,
                githubUrl: 'https://github.com/GLips/Figma-Context-MCP',
                logo: 'https://avatars.githubusercontent.com/u/5155369?s=48&v=4'
            },
             {
                name: 'Supabase',
                description: 'Connect your Supabase projects to Cursor, Claude, Windsurf, and other AI assistants.',
                command: 'npx',
                args: [
                    "-y",
                    "@supabase/mcp-server-supabase@latest",
                    "--access-token",
                    process.env.VITE_SUPABASE_ACCESS_TOKEN
                ],
                env: {},
                connected: false,
                githubUrl: 'https://github.com/supabase-community/supabase-mcp',
                logo: 'https://avatars.githubusercontent.com/u/54469796?s=48&v=4'
            },


            // {
            //     name: 'convex',
            //     description: 'convex mcp.',
            //     command: 'npx',
            //     args: ["-y", "convex@latest", "mcp", "start"],
            //     env: {},
            //     connected: false,
            //     githubUrl: ''
            //     logo
            // },  

        ]
    },
    {
        categoryName: 'Trading',
        mcps: [
             {
                name: 'pump.fun',
                description: 'A Model Context Protocol (MCP) server for interacting with the Pump.fun platform on Solana. This server enables AI assistants to create, buy, and sell tokens on the Pump.fun platform.',
                command: 'node',
                args: [
                    `${ process.env.VITE_RESOLEV_PATH}pumpfun-mcp-server/build/index.js`,
                ],
                env: {
                    "HELIUS_RPC_URL":  process.env.VITE_HELIUS_RPC_URL
                },
                connected: false,
                githubUrl: 'https://github.com/noahgsolomon/pumpfun-mcp-server',
                logo: 'https://pump.fun/_next/image?url=%2Flogo.png&w=48&q=75'
                
            },
             {
                name: 'Hyperliquid',
                description: 'An MCP server implementation that integrates the Hyperliquid SDK.',
                command: 'npx',
                args: ["-y", "@mektigboy/server-hyperliquid"],
                env: {},
                connected: false,
                githubUrl: 'https://github.com/mektigboy/server-hyperliquid',
                logo: 'https://avatars.githubusercontent.com/u/129421375?s=48&v=4'
            }, 

              {
                name: 'Binance',
                description: 'Binance MCP Server is a backend service designed to interact with the Binance API. It facilitates seamless interaction with the Binance exchange, enabling users to view their portfolio, convert tokens, and execute trades with minimal market impact. The server utilizes the Model Context Protocol (MCP) framework to ensure secure, structured, and efficient transactions.',
                command: 'node',
                args: [ process.env.VITE_RESOLEV_PATH + 'binance-mcp/build/index.js'],
                env: {
                    "BINANCE_API_KEY":  process.env.VITE_BINANCE_API_KEY,
                    "BINANCE_API_SECRET":  process.env.VITE_BINANCE_API_SECRET
                },
                connected: false,
                githubUrl: 'https://github.com/TermiX-official/binance-mcp',
                logo: 'https://avatars.githubusercontent.com/u/69836600?s=48&v=4'
            },
             {
                name: 'Uniswap',
                description: 'An MCP server for AI agents to automate token swaps on Uniswap DEX across multiple blockchains.',
                command: 'node',
                args: [
                    process.env.VITE_RESOLEV_PATH + 'uniswap-trader-mcp/index.js'
                ],
                env: {
                    "INFURA_KEY":  process.env.VITE_UNISWAP_INFURA_KEY,
                    "WALLET_PRIVATE_KEY":  process.env.VITE_UNISWAP_WALLET_PRIVATE_KEY
                },
                connected: false,
                githubUrl: 'https://github.com/kukapay/uniswap-trader-mcp',
                logo: 'https://avatars.githubusercontent.com/u/36115574?s=48&v=4'
            },

        ]
    },
    {
        categoryName: 'Social',
        mcps: [
              {
                name: 'X',
                description: 'X (Twitter) integration for posting, searching, and managing tweets',
                command: 'node',
                args: [ process.env.VITE_RESOLEV_PATH + 'x-mcp-server/build/index.js'],
                env: {
                    TWITTER_API_KEY:  process.env.VITE_GITHUB_PERSONAL_ACCESS_TOKEN || '',
                    TWITTER_API_SECRET:  process.env.VITE_GITHUB_PERSONAL_ACCESS_TOKEN || '',
                    TWITTER_ACCESS_TOKEN:  process.env.VITE_GITHUB_PERSONAL_ACCESS_TOKEN || '',
                    TWITTER_ACCESS_SECRET:  process.env.VITE_GITHUB_PERSONAL_ACCESS_TOKEN || ''
                },
                connected: false,
                githubUrl: 'https://github.com/datawhisker/x-mcp-server',
                logo: 'https://avatars.githubusercontent.com/u/50278?s=48&v=4'
            },

            {
                name: 'Notion',
                description: 'Official MCP server for Notion API.',
                command: 'npx',
                args: ["-y", "@notionhq/notion-mcp-server"],
                env: {
                    "OPENAPI_MCP_HEADERS": `{\"Authorization\": \"Bearer ${ process.env.VITE_OPENAPI_MCP_HEADERS}\", \"Notion-Version\": \"2022-06-28\" }`
                },
                connected: false,
                githubUrl: 'https://github.com/makenotion/notion-mcp-server',
                logo: 'https://avatars.githubusercontent.com/u/4792552?s=48&v=4'
            },
             {
                name: 'Discord',
                description: 'MCP server for discord bot.',
                command: 'uv',
                args: [
                    "--directory",
                    `${ process.env.VITE_RESOLEV_PATH}mcp-discord`,
                    "run",
                    "mcp-discord"
                ],
                env: {
                    "DISCORD_TOKEN":  process.env.VITE_DISCORD_BOT_TOKEN
                },
                connected: false,
                githubUrl: 'https://github.com/hanweg/mcp-discord',
                logo: 'https://avatars.githubusercontent.com/u/1965106?s=48&v=4'
            },
   
        ]
    },
]

  


//   {
//         name: 'browser-use',
//         description: 'browser-use.',
//         command: 'uvx',
//         args: [
//             "--directory",
//              process.env.VITE_RESOLEV_PATH+'mcp-browser-use',
//             "run",
//             "mcp-server-browser-use"
//         ],
//         env: {
//             "MCP_LLM_GOOGLE_API_KEY":  process.env.VITE_GOOGLE_API_KEY,
//             "MCP_LLM_PROVIDER": "openrouter",
//             "MCP_LLM_MODEL_NAME": "openai/gpt-4o-mini",
//             "MCP_BROWSER_HEADLESS": "true",
//         },
//         connected: false
//     }, 
   

   


     

   


//      {
//         name: 'AWE Core MCP Server',
//         description: 'awe core mcp',
//         command: 'uvx',
//         args: [
//             "awslabs.core-mcp-server@latest"
//         ],
//         env: {
//             "FASTMCP_LOG_LEVEL": "ERROR"
//         },
//         connected: false
//     },

//      {
//         name: 'Cloudflare Documentation MCP Server',
//         description: `This is a Model Context Protocol (MCP) server that supports remote MCP connections. It connects to a Vectorize DB (in this case, indexed w/ the Cloudflare docs)

// The Cloudflare account this worker is deployed on already has this Vectorize DB setup and indexed.`,
//         command: 'npx',
//         args: [
//             "mcp-remote", "https://docs.mcp.cloudflare.com/sse"
//         ],
//         env: {},
//         connected: false
//     },

   

    



