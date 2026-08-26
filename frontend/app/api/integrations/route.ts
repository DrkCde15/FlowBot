import { NextRequest, NextResponse } from "next/server";
import { python } from "@/lib/python_client";

export async function GET() {
  try {
    const data = await python.getIntegrations();
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

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json();
    if (url.searchParams.get("dispatch")) {
      const data = await python.setDispatch(body.integrations || []);
      return NextResponse.json(data);
    }
    const name = url.searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "name obrigatório" }, { status: 400 });
    }
    const data = await python.saveIntegration(name, body.config || {}, body.enabled ?? true);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "name obrigatório" }, { status: 400 });
    }
    const data = await python.deleteIntegration(name);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
