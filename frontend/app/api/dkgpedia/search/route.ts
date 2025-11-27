import { NextRequest, NextResponse } from "next/server";

const DKG_API_URL = process.env.NEXT_PUBLIC_DKG_API_URL || "http://localhost:9200";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get("keyword") || "";
    const limit = searchParams.get("limit") || "10";

    // Build query params
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    params.append("limit", limit);

    const response = await fetch(
      `${DKG_API_URL}/dkgpedia/community-notes?${params}`,
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
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search knowledge assets" },
      { status: 500 }
    );
  }
}

