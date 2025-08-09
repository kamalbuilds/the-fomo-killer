import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';
import { BaseAgentsServer } from '../../../lib/agents/server';

// Global server instance using globalThis for Next.js
declare global {
  var agentServer: BaseAgentsServer | undefined;
}

/**
 * GET /api/agents - Get agent status and health
 */
export async function GET(request: NextRequest) {
  try {
    // Optional paid gating: if client did not include payment headers and feature is enabled, respond 402
    if (process.env.X402_SELLER_ADDRESS && process.env.X402_PRICE_USDC_CENTS) {
      const paid = request.headers.get('x402-payment');
      if (!paid) {
        const priceCents = Number(process.env.X402_PRICE_USDC_CENTS);
        return new NextResponse(
          JSON.stringify({ error: 'Payment required' }),
          {
            status: 402,
            headers: {
              'content-type': 'application/json',
              // Basic hint header. For full spec, follow x402 Quickstart for Sellers
              'www-authenticate': `x402 realm="BasedAgents", address="${process.env.X402_SELLER_ADDRESS}", amount_cents="${priceCents}", currency="USDC", network="base"`,
            },
          },
        );
      }
    }
    if (!global.agentServer) {
      // Try to auto-start the agent server
      try {
        global.agentServer = new BaseAgentsServer();
        await global.agentServer.start();
      } catch (err) {
        return NextResponse.json({
          error: 'Agent server not initialized and failed to auto-start',
          details: err instanceof Error ? err.message : String(err),
          agents: [],
          health: { status: 'offline', uptime: 0, agents: {}, xmtpConnected: false, lastHealthCheck: '' }
        }, { status: 503 });
      }
    }

    const health = global.agentServer.getSystemHealth();
    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting agent status:', error);
    return NextResponse.json({
      error: 'Failed to get agent status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/agents - Start/manage agent server
 */
export async function POST(request: NextRequest) {
  try {
    // Example: ensure CDP v2 is correctly configured when starting server
    if (process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET && process.env.CDP_WALLET_SECRET) {
      try {
        const cdp = new (CdpClient as any)();
        // Lazy touch to ensure credentials load; will throw if misconfigured
        await cdp.evm?.getOrCreateAccount?.({ name: 'based-agents-health' }).catch(() => {});
      } catch {
        // continue; we don't block server start, but integration is present
      }
    }
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        if (global.agentServer && global.agentServer.getSystemHealth().status === 'healthy') {
          return NextResponse.json({ 
            message: 'Agent server already running',
            health: global.agentServer.getSystemHealth()
          });
        }

        global.agentServer = new BaseAgentsServer();
        await global.agentServer.start();

        return NextResponse.json({
          success: true,
          message: 'Agent server started successfully',
          health: global.agentServer.getSystemHealth()
        });

      case 'stop':
        if (!global.agentServer) {
          return NextResponse.json({ 
            message: 'Agent server not running'
          });
        }

        await global.agentServer.stop();
        global.agentServer = undefined;

        return NextResponse.json({
          success: true,
          message: 'Agent server stopped successfully'
        });

      case 'restart':
        if (global.agentServer) {
          await global.agentServer.stop();
        }
        
        global.agentServer = new BaseAgentsServer();
        await global.agentServer.start();

        return NextResponse.json({
          success: true,
          message: 'Agent server restarted successfully',
          health: global.agentServer.getSystemHealth()
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use start, stop, or restart'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing agent server:', error);
    return NextResponse.json({ 
      error: 'Failed to manage agent server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 