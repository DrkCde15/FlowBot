import { NextRequest, NextResponse } from "next/server";
import { python } from "@/lib/python_client";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const data = await python.runAction(params.slug, body);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "runtime_unavailable", detail: String(err) },
      { status: 502 }
    );
  }
}
