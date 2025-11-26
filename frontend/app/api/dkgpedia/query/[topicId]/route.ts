import { NextRequest, NextResponse } from "next/server";

const DKG_API_URL = process.env.NEXT_PUBLIC_DKG_API_URL || "http://localhost:9200";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    const response = await fetch(
      `${DKG_API_URL}/dkgpedia/community-notes/${encodeURIComponent(topicId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to query knowledge asset" },
      { status: 500 }
    );
  }
}

