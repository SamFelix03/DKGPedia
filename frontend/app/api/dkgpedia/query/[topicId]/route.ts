import { NextRequest, NextResponse } from "next/server";

const DKG_API_URL = process.env.NEXT_PUBLIC_DKG_API_URL || "http://localhost:9200";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    // Forward payment headers from client to backend (x402 payment support)
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Forward X-PAYMENT header if present (from x402-axios)
    const xPaymentHeader = request.headers.get("x-payment");
    if (xPaymentHeader) {
      headers["x-payment"] = xPaymentHeader;
    }

    // Forward other x402-related headers
    const x402Headers = ["x-payment-version", "x-payment-signature", "x-payment-timestamp"];
    for (const headerName of x402Headers) {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        headers[headerName] = headerValue;
      }
    }

    const response = await fetch(
      `${DKG_API_URL}/dkgpedia/community-notes/${encodeURIComponent(topicId)}`,
      {
        method: "GET",
        headers,
      }
    );

    const data = await response.json();

    // Forward 402 Payment Required responses as-is (with payment info)
    if (response.status === 402) {
      // Forward x402 response headers
      const x402Headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith("x-")) {
          x402Headers[key] = value;
        }
      });
      
      return NextResponse.json(data, { 
        status: 402,
        headers: x402Headers,
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to query knowledge asset" },
      { status: 500 }
    );
  }
}

