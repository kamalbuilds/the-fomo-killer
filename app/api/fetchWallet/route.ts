import { CdpClient } from "@coinbase/cdp-sdk";
import { NextRequest, NextResponse } from "next/server";

const cdp = new CdpClient();

export async function POST(req: NextRequest) {
    const { address } = await req.json();

    if (!address || typeof address !== "string") {
        return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    try {
        const name = address.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 36).replace(/^-+|-+$/g, "");
        const account = await cdp.evm.getOrCreateAccount({ name });
        // Fetch balances using Token Balances API (via SDK)
        // Token balances via CDP API v2 REST can be accessed through action provider tools
        // or separate server utilities. For now, respond with account; balances can be fetched client-side.
        return NextResponse.json({ wallet: account });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}