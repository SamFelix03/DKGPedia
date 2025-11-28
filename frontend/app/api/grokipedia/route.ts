import { NextRequest, NextResponse } from "next/server";

const GROKIPEDIA_API_URL = "https://grokipediafetch-739298578243.us-central1.run.app/scrape";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    const response = await fetch(GROKIPEDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Grokipedia API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Grokipedia fetch error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch Grokipedia article",
      },
      { status: 500 }
    );
  }
}

