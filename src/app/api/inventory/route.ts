/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

/**
 * Endpoint para actualizar inventario en Medusa v2.x
 * Compatible con modelos nuevos (inventory_items) y viejos (inventory_quantity)
 */
export async function POST(req: Request) {
  try {
    const { variantId, quantity } = await req.json();

    if (!variantId || !quantity) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const adminKey = process.env.MEDUSA_ADMIN_API_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

    if (!medusaUrl || !adminKey) {
      throw new Error("Faltan variables de entorno de Medusa");
    }

    console.log(`📦 Actualizando inventario de ${variantId} (-${quantity})`);

    // 1️⃣ Obtener información de la variante
    const variantRes = await fetch(`${medusaUrl}/store/variants/${variantId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(publishableKey && { "x-publishable-api-key": publishableKey }),
      },
    });

    if (!variantRes.ok) {
      const errText = await variantRes.text();
      throw new Error(`Error obteniendo variante: ${variantRes.status} - ${errText}`);
    }

    const variantData = await variantRes.json();
    const variant = variantData.variant;
    if (!variant) throw new Error("Variante no encontrada en Medusa");

    console.log(`🧩 Variante encontrada: ${variant.title || variant.id}`);

    // 2️⃣ Detectar si usa inventory_items (nuevo modelo)
    const inventoryItems = variant.inventory_items || [];

    if (inventoryItems.length > 0) {
      console.log(`🧮 Actualizando ${inventoryItems.length} inventory_items...`);

      const results = [];
      for (const item of inventoryItems) {
        const itemId = item.inventory_item_id || item.id;
        if (!itemId) continue;

        const locationId = item.location_id || process.env.DEFAULT_LOCATION_ID;
        if (!locationId) {
          console.warn(`⚠️ No se encontró location_id para ${itemId}, omitiendo`);
          continue;
        }

        // Obtener nivel actual
        const levelRes = await fetch(`${medusaUrl}/admin/inventory-items/${itemId}/location-levels`, {
          headers: {
            "Authorization": `Bearer ${adminKey}`,
          },
        });

        if (!levelRes.ok) {
          console.warn(`⚠️ No se pudo obtener nivel de inventario de ${itemId}`);
          continue;
        }

        const { inventory_levels } = await levelRes.json();
        const level = inventory_levels?.find((lvl: any) => lvl.location_id === locationId);
        const currentQty = level?.available_quantity ?? 0;
        const newQty = Math.max(0, currentQty - quantity);

        console.log(`✏️ ${itemId}: ${currentQty} → ${newQty}`);

        const updateRes = await fetch(`${medusaUrl}/admin/inventory-items/${itemId}/location-levels/${locationId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminKey}`,
          },
          body: JSON.stringify({
            available_quantity: newQty,
          }),
        });

        if (!updateRes.ok) {
          console.error(`❌ Error actualizando item ${itemId}: ${await updateRes.text()}`);
          continue;
        }

        results.push({ itemId, previous: currentQty, newQty });
      }

      return NextResponse.json({
        success: true,
        message: "Inventario actualizado (v2 model)",
        results,
      });
    }

    // 3️⃣ Compatibilidad con variantes antiguas (sin inventory_items)
    const currentQty = variant.inventory_quantity ?? 0;
    const newQty = Math.max(0, currentQty - quantity);

    console.log(`🧮 Actualizando variante legacy: ${currentQty} → ${newQty}`);

    const updateRes = await fetch(`${medusaUrl}/admin/variants/${variantId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminKey}`,
      },
      body: JSON.stringify({
        inventory_quantity: newQty,
      }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Error al actualizar variante: ${errText}`);
    }

    const result = await updateRes.json();

    return NextResponse.json({
      success: true,
      message: "Inventario actualizado (legacy model)",
      variantId,
      previousStock: currentQty,
      newStock: newQty,
      variantTitle: variant.title,
      result,
    });

  } catch (error: any) {
    console.error("❌ Error en /api/inventory:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
