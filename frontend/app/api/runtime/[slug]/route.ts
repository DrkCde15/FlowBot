import { NextResponse } from "next/server";
import { python } from "@/lib/python_client";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await python.getFlow(params.slug);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "runtime_unavailable", detail: String(err) },
      { status: 502 }
    );
  }
}
