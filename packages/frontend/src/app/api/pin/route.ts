import { NextRequest, NextResponse } from "next/server";
import { pinReport } from "@/lib/pinata";
import type { ReportContent } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ReportContent = await request.json();

    if (!body.title || !body.body || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: title, body, category" },
        { status: 400 }
      );
    }

    const cid = await pinReport({
      title: body.title,
      body: body.body,
      category: body.category,
      evidenceLinks: body.evidenceLinks || [],
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ cid });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to pin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
