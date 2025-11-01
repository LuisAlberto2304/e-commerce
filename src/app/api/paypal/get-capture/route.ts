/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import fetch from "node-fetch";

const PAYPAL_BASE = process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com";

/**
 * Endpoint que obtiene el capture_id real de un orderID de PayPal
 */
export async function POST(req: Request) {
  try {
    const { orderID } = await req.json();
    if (!orderID) {
      return NextResponse.json(
        { error: "Falta el orderID" },
        { status: 400 }
      );
    }

    // 🔐 Obtener token de acceso PayPal
    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(`Error obteniendo token: ${JSON.stringify(tokenData)}`);
    }

    // 🔍 Consultar detalles del pedido
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(`Error obteniendo orden: ${JSON.stringify(orderData)}`);
    }

    // 🧩 Extraer el capture_id
    const captureId =
      orderData.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

    if (!captureId) {
      throw new Error("No se encontró ningún capture_id en la orden PayPal.");
    }

    return NextResponse.json({ captureId });
  } catch (err: any) {
    console.error("❌ Error en get-capture:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
