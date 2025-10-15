/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { cartId } = await req.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${cartId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "",
        },
      }
    );

    const text = await response.text();

    console.log("📦 Complete cart response status:", response.status);
    console.log("📦 Response body:", text);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error ${response.status}: ${text}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ Error al completar carrito:", error);
    return NextResponse.json(
      { error: "No se pudo completar el carrito", details: error.message },
      { status: 500 }
    );
  }
}
