import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const DKG_API_URL = process.env.NEXT_PUBLIC_DKG_API_URL || "http://localhost:9200";

// Configure route to have very long timeout
export const maxDuration = 300; // 5 minutes (max for Vercel, adjust for your deployment)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use axios with extended timeout (30 minutes) - DKG publishing can take a while
    // Axios provides better timeout control than fetch
    const response = await axios.post(
      `${DKG_API_URL}/dkgpedia/community-notes`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30 * 60 * 1000, // 30 minutes timeout
        // Disable default timeout by setting a very high value
        maxRedirects: 5,
        validateStatus: (status) => status < 600, // Accept all status codes
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Publish error:", error);
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          success: false,
          ual: null,
          error: "Publish operation timed out. The asset may still be processing. Please check back later or try again." 
        },
        { status: 504 }
      );
    }
    
    // Handle other axios errors
    if (error.response) {
      return NextResponse.json(
        { 
          success: false,
          ual: null,
          error: error.response.data?.error || error.message || "Failed to publish knowledge asset" 
        },
        { status: error.response.status || 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        ual: null,
        error: error.message || "Failed to publish knowledge asset" 
      },
      { status: 500 }
    );
  }
}

