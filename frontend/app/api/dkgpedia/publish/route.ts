import { NextRequest, NextResponse } from "next/server";

const DKG_API_URL = process.env.NEXT_PUBLIC_DKG_API_URL || "http://localhost:9200";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${DKG_API_URL}/dkgpedia/community-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish knowledge asset" },
      { status: 500 }
    );
  }
}

