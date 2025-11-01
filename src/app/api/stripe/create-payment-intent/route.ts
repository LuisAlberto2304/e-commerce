/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover", // usa la versión correcta
});

export async function POST(req: Request) {
  try {
    const { amount, currency } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    console.log("Creando PaymentIntent con:", amount, currency);

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // en centavos
      currency,
      automatic_payment_methods: { enabled: true },
      description: "Compra en E-tianguis",
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
