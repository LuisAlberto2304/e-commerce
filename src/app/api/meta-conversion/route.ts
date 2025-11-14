import { NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID!;

export async function POST(req: Request) {
  const event = await req.json();

  const payload = {
    data: [
      {
        event_name: event.name, // ej. "Purchase", "AddToCart"
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          em: [event.emailHash], // hash SHA256 del email si lo tienes
        },
        custom_data: event.customData || {},
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
