import { NextRequest, NextResponse } from "next/server";

const ANALYZE_API_URL = process.env.ANALYZE_API_URL || "https://e2e96c275459.ngrok-free.app";

// Progress endpoint - GET request to check analysis status
export async function GET(request: NextRequest) {
  try {
    // Call the progress endpoint (no parameters needed)
    const progressResponse = await fetch(`${ANALYZE_API_URL}/progress`, {
      method: "GET",
    });

    if (!progressResponse.ok) {
      throw new Error(`Progress endpoint returned ${progressResponse.status}`);
    }

    const progressData = await progressResponse.json();
    return NextResponse.json(progressData);
  } catch (error) {
    console.error("Progress check error:", error);
    return NextResponse.json(
      { error: "Failed to check progress", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

