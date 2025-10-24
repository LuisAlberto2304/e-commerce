// Utilidad para procesar el checkout completo
export async function processCompleteCheckout() {
  try {
    // Recuperar datos guardados
    const paymentPreparation = localStorage.getItem("payment-preparation");
    const currentOrder = localStorage.getItem("currentOrder");
    
    if (!paymentPreparation || !currentOrder) {
      throw new Error("Datos de checkout no encontrados");
    }

    const preparationData = JSON.parse(paymentPreparation);
    const orderData = JSON.parse(currentOrder);

    console.log("🔄 Iniciando proceso de checkout completo...");

    // 1. Crear carrito en Medusa
    const cartResponse = await fetch("/api/medusa/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region_id: process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION,
        items: preparationData.items,
        email: preparationData.customerEmail
      })
    });

    if (!cartResponse.ok) {
      throw new Error("Error creando carrito en Medusa");
    }

    const cartData = await cartResponse.json();
    const cartId = cartData.cart?.id;

    if (!cartId) {
      throw new Error("No se pudo obtener el ID del carrito");
    }

    console.log("✅ Carrito creado:", cartId);

    // 2. Asociar carrito con usuario y dirección
    const updateCartResponse = await fetch(`/api/medusa/cart/${cartId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: preparationData.customerEmail,
        shipping_address: preparationData.shippingAddress
      })
    });

    if (!updateCartResponse.ok) {
      throw new Error("Error asociando carrito con usuario/dirección");
    }

    console.log("✅ Carrito actualizado con dirección");

    // 3. Agregar método de envío
    const shippingResponse = await fetch(`/api/medusa/cart/${cartId}/shipping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        option_id: preparationData.shippingOptionId
      })
    });

    if (!shippingResponse.ok) {
      throw new Error("Error agregando método de envío");
    }

    console.log("✅ Método de envío agregado");

    return {
      success: true,
      cartId,
      orderData,
      preparationData
    };

  } catch (error: any) {
    console.error("❌ Error en proceso de checkout:", error);
    return {
      success: false,
      error: error.message
    };
  }
}