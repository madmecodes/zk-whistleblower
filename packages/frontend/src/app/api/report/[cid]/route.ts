import { NextRequest, NextResponse } from "next/server";
import { fetchReport } from "@/lib/pinata";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params;
    const content = await fetchReport(cid);
    return NextResponse.json(content);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
