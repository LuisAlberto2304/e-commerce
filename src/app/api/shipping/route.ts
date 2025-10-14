// /app/api/shipping/route.ts
import { NextResponse } from "next/server";

const localRates = [
  { zone: "MX-Norte", countries: ["Mexico", "MX"], baseRate: 80, estimatedDays: 3 },
  { zone: "MX-Sur", countries: ["Mexico"], baseRate: 100, estimatedDays: 4 },
  { zone: "US", countries: ["Estados Unidos", "USA", "US"], baseRate: 150, estimatedDays: 5 },
  { zone: "EU", countries: ["France", "Germany", "Spain", "FR", "DE", "ES"], baseRate: 200, estimatedDays: 7 },
  { zone: "INTL", countries: ["Canadá", "Argentina", "Brasil", "Chile", "CA"], baseRate: 250, estimatedDays: 8 },
];

export async function POST(req: Request) {
  try {
    // 🔹 Leer el body UNA sola vez
    const text = await req.text();
    const { country, weight = 1, method = "Económico" } = JSON.parse(text);

    if (!country) {
      return NextResponse.json(
        { error: "El campo 'country' es obligatorio" },
        { status: 400 }
      );
    }

    // 🔹 Buscar tarifa local según país
    const local = localRates.find((r) =>
      r.countries.some((c) => c.toLowerCase() === country.toLowerCase())
    ) || localRates[0];

    let rate = local.baseRate;
    let days = local.estimatedDays;

    // 🔹 Ajuste según método de envío
    switch (method.toLowerCase()) {
      case "exprés":
        rate *= 1.5;
        days = Math.max(days - 1, 1);
        break;
      case "prioritario":
        rate *= 2;
        days = Math.max(days - 2, 1);
        break;
      case "económico":
      default:
        rate *= 0.8;
        days += 1;
        break;
    }

    // 🔹 Intentar obtener tarifa externa (opcional)
    let externalRate: number | null = null;
    try {
      const apiRes = await fetch("https://api.fake-shipping.com/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, weight }),
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        externalRate = apiData.rate;
      }
    } catch {
      console.warn("⚠️ No se pudo obtener tarifa externa, usando local");
    }

    const finalRate = externalRate ?? rate;
    const source = externalRate ? "API externa" : "Tabla local";

    return NextResponse.json({
      shippingCost: finalRate,
      estimatedDays: days,
      zone: local.zone,
      source,
    });
  } catch (err) {
    console.error("❌ Error al calcular envío:", err);
    return NextResponse.json(
      { error: "Error interno al calcular el envío" },
      { status: 500 }
    );
  }
}
