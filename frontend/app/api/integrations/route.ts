import { NextRequest, NextResponse } from "next/server";
import { python } from "@/lib/python_client";

export async function GET() {
  try {
    const data = await python.listIntegrations();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { integrations, event } = await req.json();
    const data = await python.dispatch(integrations, event);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
