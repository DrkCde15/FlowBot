import { NextResponse } from "next/server";
import { python } from "@/lib/python_client";

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await python.startConversation(params.slug);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "runtime_unavailable", detail: String(err) },
      { status: 502 }
    );
  }
}
