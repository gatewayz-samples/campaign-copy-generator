import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GATEWAYZ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GATEWAYZ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const gateway = searchParams.get('gateway') || 'openrouter';
    const limit = searchParams.get('limit') || '50';

    const response = await fetch(
      `https://api.gatewayz.ai/v1/models?gateway=${gateway}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch models' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
