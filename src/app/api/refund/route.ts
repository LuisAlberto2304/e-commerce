/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { refundStripe } from "../refund-stripe";
import { refundPayPal } from "../refund-paypal";
import { adminDB } from "@/app/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Falta el ID del pedido" },
        { status: 400 }
      );
    }

    // 🔹 Obtener la orden desde Firestore
    const orderRef = adminDB.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Pedido no encontrado en Firestore" },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data() as any;

    // 🔹 Verificar método de pago y ejecutar refund
    let refundResult;

    if (orderData.payment_method === "stripe") {
      refundResult = await refundStripe(orderData.payment_intent_id, orderData.total);
    } else if (orderData.payment_method === "paypal") {
      // ⚠️ Corregido: usar capture_id de PayPal
      refundResult = await refundPayPal(orderData.paypal_capture_id, orderData.total);
    } else {
      throw new Error("Método de pago no soportado para reembolsos");
    }

    // 🔹 Actualizar el estado del pedido en Firestore
    await orderRef.update({
      status: "refunded",
      refund: {
        id: refundResult.id,
        provider: refundResult.provider,
        date: new Date().toISOString(),
      },
    });

    console.log(`✅ Reembolso completado para ${orderId}:`, refundResult);

    return NextResponse.json({
      success: true,
      message: `Reembolso completado correctamente en ${refundResult.provider}`,
      refund: refundResult,
    });
  } catch (err: any) {
    console.error("❌ Error procesando refund:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
