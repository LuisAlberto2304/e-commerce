/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!;
const ADMIN_TOKEN = process.env.MEDUSA_ADMIN_API_KEY!; // 🔑 clave de administrador de Medusa

export async function PUT(req: Request) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No se recibieron productos válidos" }, { status: 400 });
    }

    const updatedItems: any[] = [];

    for (const item of items) {
      const { variantId, quantity } = item;

      // 1️⃣ Obtener el variant con inventory info
      const variantRes = await fetch(`${MEDUSA_URL}/admin/variants/${variantId}?expand=inventory_items.inventory.location_levels`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });

      if (!variantRes.ok) {
        console.error(`❌ No se pudo obtener el variant ${variantId}`);
        continue;
      }

      const variantData = await variantRes.json();
      const variant = variantData.variant;

      const inventoryItem = variant?.inventory_items?.[0];
      const inventoryItemId = inventoryItem?.inventory_item_id;
      const locationId = inventoryItem?.inventory?.location_levels?.[0]?.location_id;

      if (!inventoryItemId || !locationId) {
        console.error(`⚠️ Variant ${variantId} no tiene inventario o ubicación asociada`);
        continue;
      }

      // 2️⃣ Restar cantidad del inventario
      const adjustRes = await fetch(`${MEDUSA_URL}/admin/inventory-items/${inventoryItemId}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          location_id: locationId, // 👈 obligatorio cuando hay varios almacenes
          adjustment: -quantity,   // 👈 valor negativo para restar
        }),
      });

      if (!adjustRes.ok) {
        const errorText = await adjustRes.text();
        console.error(`❌ Error ajustando inventario: ${errorText}`);
        continue;
      }

      updatedItems.push({
        variantId,
        inventoryItemId,
        locationId,
        quantityReduced: quantity,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Inventario actualizado correctamente",
      updated: updatedItems,
    });
  } catch (error: any) {
    console.error("❌ Error al actualizar inventario:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}