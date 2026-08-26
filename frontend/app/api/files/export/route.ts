import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const format = req.nextUrl.searchParams.get("format") || "json";
  try {
    const upstream = await fetch(
      `${BASE}/api/v1/files/export?slug=${encodeURIComponent(slug)}&format=${format}`,
      { cache: "no-store" }
    );
    if (!upstream.ok) {
      return NextResponse.json({ error: "export_failed" }, { status: upstream.status });
    }
    const body = await upstream.text();
    const disposition = upstream.headers.get("content-disposition") || `attachment; filename=${slug}.${format}`;
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": disposition,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
