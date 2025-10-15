import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { cartId, items } = await req.json();

  for (const item of items) {
    await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/carts/${cartId}/line-item`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: item.variant_id,
          quantity: item.quantity,
        }),
      }
    );
  }

  return NextResponse.json({ success: true });
}
