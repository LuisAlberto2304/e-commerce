/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medusa/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const ADMIN_KEY = process.env.MEDUSA_ADMIN_API_KEY;

    if (!MEDUSA_URL || !ADMIN_KEY) {
      return NextResponse.json(
        { error: "Missing Medusa configuration" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const medusaResponse = await fetch(`${MEDUSA_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // Forward the token from the client
      },
      body: JSON.stringify(body),
    });

    const resText = await medusaResponse.text();
    let data = {};

    try { data = JSON.parse(resText); } catch { }

    if (!medusaResponse.ok) {
      return NextResponse.json(
        { status: medusaResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Medusa connection error", details: error.message },
      { status: 500 }
    );
  }
}
