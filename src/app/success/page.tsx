/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { getAuth } from "firebase/auth";
import { gtagEvent, isGAAvailable } from "../lib/gtag";

// ✅ Función SIMPLIFICADA para Facebook Pixel
// ✅ Función MEJORADA para Facebook Pixel
const fbqTrack = (event: string, data?: Record<string, any>) => {
  if (typeof window === "undefined") return;

  // Verificar consentimiento de marketing PRIMERO
  const storedConsent = localStorage.getItem('cookieConsent');
  let hasMarketingConsent = false;
  
  if (storedConsent) {
    try {
      const consent = JSON.parse(storedConsent);
      hasMarketingConsent = consent.marketing;
      
      if (!hasMarketingConsent) {
        console.log(`🚫 Facebook Pixel: ${event} - marketing not consented`);
        return;
      }
    } catch (error) {
      console.error('Error parsing consent:', error);
      return;
    }
  } else {
    console.log(`🚫 Facebook Pixel: ${event} - no consent found (user hasn't accepted cookies)`);
    return;
  }

  console.log(`🎯 Attempting Facebook Pixel: ${event}`, data);

  // Si tenemos consentimiento pero fbq no está disponible
  if (typeof window.fbq !== "function") {
    console.log(`⏳ Facebook Pixel: ${event} - fbq not available yet (Pixel not loaded)`);
    console.log('💡 Possible causes:');
    console.log('   - CookieBanner not initialized');
    console.log('   - User rejected marketing cookies');
    console.log('   - Facebook Pixel script failed to load');
    return;
  }

  // Enviar el evento
  window.fbq('track', event, data);
  console.log(`✅ Facebook Pixel: ${event} sent successfully`);
};

export default function SuccessPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          console.warn("⚠️ No hay usuario autenticado");
          setLoading(false);
          return;
        }

        console.log("🔍 Buscando órdenes para usuario:", user.uid);

        // Consulta la última orden del usuario autenticado
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const querySnapshot = await getDocs(q);

        console.log("📊 Resultados de la consulta:", querySnapshot.size, "documentos");

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const orderData = doc.data();
          console.log("🧾 Orden cargada desde Firebase:", orderData);
          console.log("📦 Items en la orden:", orderData.items?.length);
          setOrder({ id: doc.id, ...orderData });
        } else {
          console.log("❌ No se encontró ninguna orden reciente para el usuario:", user.uid);
        }
      } catch (error) {
        console.error("❌ Error obteniendo orden:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  // En tu Success/page.tsx - MODIFICA el useEffect
useEffect(() => {
  if (order) {
    const total = order.total ?? 0;

    // Google Analytics
    if (isGAAvailable()) {
      gtagEvent("purchase", {
        transaction_id: order.id,
        value: total,
        currency: "MXN",
        tax: total * 0.16,
        shipping: order.shippingCost ?? 0,
        items: order.items?.map((item: any) => ({
          item_id: item.productId || item.id,
          item_name: item.title,
          item_variant: item.variantDescription || "",
          price: item.price,
          quantity: item.quantity,
        })),
      });
      console.log("📊 GA4 Event: purchase enviado con", order.items?.length, "productos");
    }

    // ✅ FACEBOOK PIXEL - VERSIÓN SIMPLIFICADA Y CORREGIDA
    const sendFacebookPixelEvent = () => {
      const pixelData = {
        value: total,
        currency: 'MXN',
        content_type: 'product',
        content_ids: order.items?.map((item: any) => item.productId || item.id),
        contents: order.items?.map((item: any) => ({
          id: item.productId || item.id,
          quantity: item.quantity,
          item_price: item.price
        })),
        num_items: order.items?.length || 0,
        shipping: order.shippingCost ?? 0,
        tax: total * 0.16
      };

      console.log('🎯 Attempting Facebook Pixel: Purchase', pixelData);

      // Verificar consentimiento
      const storedConsent = localStorage.getItem('cookieConsent');
      if (!storedConsent) {
        console.log('🚫 Facebook Pixel: No consent found');
        return;
      }

      try {
        const consent = JSON.parse(storedConsent);
        if (!consent.marketing) {
          console.log('🚫 Facebook Pixel: Marketing not consented');
          return;
        }
      } catch (error) {
        console.error('Error parsing consent:', error);
        return;
      }

      // Si fbq está disponible, enviar evento
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', pixelData);
        console.log('✅ Facebook Pixel: Purchase sent successfully');
      } else {
        console.log('⏳ Facebook Pixel: fbq not available');
        
        // ✅ REINTENTOS SIMPLES
        const maxRetries = 3;
        let retryCount = 0;
        
        const trySendEvent = () => {
          retryCount++;
          
          if (typeof window.fbq === 'function') {
            window.fbq('track', 'Purchase', pixelData);
            console.log(`✅ Facebook Pixel: Purchase sent on retry ${retryCount}`);
          } else if (retryCount < maxRetries) {
            console.log(`🔄 Retry ${retryCount}/${maxRetries} - waiting...`);
            setTimeout(trySendEvent, 2000); // Reintentar después de 2 segundos
          } else {
            console.log(`❌ Facebook Pixel: Failed after ${maxRetries} retries`);
            console.log('💡 The Pixel may not be loaded on this page');
          }
        };
        
        // Primer reintento después de 1 segundo
        setTimeout(trySendEvent, 1000);
      }
    };

    // Ejecutar el evento
    sendFacebookPixelEvent();
    console.log("🎯 Todos los eventos de tracking procesados");
  }
}, [order]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500">Cargando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <h1 className="text-3xl font-semibold mb-2">Sin pedidos recientes 🕓</h1>
        <p className="text-gray-500 mb-6 max-w-sm">
          No encontramos ningún pedido reciente. Asegúrate de completar el proceso de pago correctamente.
        </p>
        <Link
          href="/"
          className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  // === (El resto de tu código permanece igual) ===
  const shipping = order.shippingCost ?? 0;
  const total = order.total ?? 0;

  const subtotal = order.items && Array.isArray(order.items) 
    ? order.items.reduce((sum: number, item: any) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
      }, 0)
    : 0;

  const ivaRate = 0.16;
  const ivaProductos = subtotal * ivaRate;
  const ivaEnvio = shipping * ivaRate;
  const ivaTotal = ivaProductos + ivaEnvio;
  const totalConIVA = total;

  const getOrderDate = () => {
    try {
      if (order.createdAt?.toDate) {
        return order.createdAt.toDate().toLocaleString("es-MX");
      } else if (order.createdAt) {
        return new Date(order.createdAt).toLocaleString("es-MX");
      } else if (order.firebaseCreated) {
        return new Date(order.firebaseCreated).toLocaleString("es-MX");
      }
      return "Fecha no disponible";
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Fecha no disponible";
    }
  };

  const orderDate = getOrderDate();

  const getAddress = () => {
    if (order.address && typeof order.address === 'object') {
      return {
        fullName: `${order.address.first_name || ""} ${order.address.last_name || ""}`.trim() || "Sin nombre",
        street: order.address.address_1 || order.address.street || "Calle no registrada",
        city: order.address.city || "Ciudad no registrada",
        state: order.address.province || order.address.state || "",
        country: order.address.country_code || order.address.country || "País no registrado",
        postalCode: order.address.postal_code || order.address.postalCode || "N/A",
        phone: order.address.phone || "Celular no registrado",
      };
    }
    
    return {
      fullName: `${order.first_name || ""} ${order.last_name || ""}`.trim() || "Sin nombre",
      street: order.address_1 || "Calle no registrada",
      city: order.city || "Ciudad no registrada",
      state: order.province || "",
      country: order.country_code || "País no registrado",
      postalCode: order.postal_code || "N/A",
      phone: order.phone || "Celular no registrado",
    };
  };

  const address = getAddress();
  const hasItems = order.items && Array.isArray(order.items) && order.items.length > 0;

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl mt-10 overflow-hidden border border-gray-200">
      {/* Encabezado */}
      <div className="bg-green-600 text-white text-center py-8 px-6">
        <h1 className="text-2xl font-bold mb-1">¡Gracias por tu compra!</h1>
        <p className="text-sm opacity-90">Pedido #{order.id}</p>
        <p className="text-xs opacity-75">Fecha: {orderDate}</p>
        <p className="text-xs opacity-75 mt-1">Estado: {order.status || "Completado"}</p>
      </div>

      {/* Contenido */}
      <div className="p-8 space-y-6">
        {/* Datos del cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Datos del cliente</h2>
            <div className="text-gray-700 text-sm space-y-1">
              <p><strong>Nombre:</strong> {address.fullName}</p>
              <p><strong>Correo:</strong> {order.email}</p>
              <p><strong>Teléfono:</strong> {address.phone}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Dirección de envío</h2>
            <div className="text-gray-700 text-sm space-y-1">
              <p>{address.street}</p>
              <p>{address.city}, {address.state}</p>
              <p>{address.country}</p>
              <p>CP: {address.postalCode}</p>
              <p><strong>Método:</strong> {order.shippingMethod || "No especificado"}</p>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Artículos del pedido</h2>
          {hasItems ? (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left">Producto</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, i: number) => (
                    <tr key={i} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{item.title}</div>
                          {item.variantDescription && (
                            <div className="text-xs text-gray-500">{item.variantDescription}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">${(item.price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              No se encontraron artículos en este pedido
            </div>
          )}
        </div>

        {/* Método de pago */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Información de pago</h2>
          <div className="text-gray-700 text-sm">
            <p><strong>Método de pago:</strong> {order.payment_method ? order.payment_method.toUpperCase() : "No especificado"}</p>
            {order.paypal_capture_id && (
              <p><strong>ID de transacción:</strong> {order.paypal_capture_id}</p>
            )}
          </div>
        </div>

        {/* Totales */}
        <div className="border-t pt-4 text-right space-y-1 text-gray-700">
          <p>Envío: ${shipping.toFixed(2)}</p>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>IVA productos: ${ivaProductos.toFixed(2)}</p>
          <p>IVA envío: ${ivaEnvio.toFixed(2)}</p>
          <p className="font-medium">IVA total: ${ivaTotal.toFixed(2)}</p>
          <hr className="my-2" />
          <p className="text-xl font-semibold text-gray-900">
            Total con IVA: ${totalConIVA.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Pie */}
      <div className="bg-gray-50 border-t px-6 py-6 text-center space-y-3">
        <p className="text-gray-600 text-sm">
          Recibirás un correo con la confirmación y los detalles de tu pedido.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Volver al inicio
          </Link>
          <Link
            href="/profile/orders"
            className="border border-gray-400 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}