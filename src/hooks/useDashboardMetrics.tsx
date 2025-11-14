/* eslint-disable prefer-const */
"use client";
import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebaseClient";
import { collection, getDocs, query, where } from "firebase/firestore";

interface RevenueSource {
  source: string;
  value: number;
}

interface DashboardMetrics {
  conversionRate: number;
  AOV: number;
  abandonmentRate: number;
  revenueBySource: RevenueSource[];
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  usersWithOrders: number;
  usersWithCart: number;
  loading: boolean;
  error: string | null;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    conversionRate: 0,
    AOV: 0,
    abandonmentRate: 0,
    revenueBySource: [],
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    usersWithOrders: 0,
    usersWithCart: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true, error: null }));

        console.log("🚀 INICIANDO CARGA DE MÉTRICAS...");

        // 1️⃣ Obtener usuarios y órdenes en paralelo
        const [usersSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "orders"))
        ]);

        const totalUsers = usersSnap.size;
        const users = usersSnap.docs;

        console.log("📊 Total usuarios:", totalUsers);
        console.log("📊 Total órdenes:", ordersSnap.size);

        // 2️⃣ Filtrar órdenes pagadas/completadas
        const paidOrders = ordersSnap.docs.filter((d) => {
          const data = d.data();
          return data.status === "paid" || data.status === "completed";
        });

        console.log("💰 Órdenes pagadas:", paidOrders.length);

        // 3️⃣ Obtener userIds de órdenes completadas
        const completedUserIds = new Set();
        paidOrders.forEach((order) => {
          const orderData = order.data();
          completedUserIds.add(orderData.userId);
        });

        console.log("✅ UserIds con órdenes completadas:", Array.from(completedUserIds));

        // 4️⃣ VERIFICAR CARRITOS
        console.log("🛒 BUSCANDO CARRITOS...");
        
        const cartCheckPromises = users.map(async (userDoc) => {
          const userId = userDoc.id;
          
          try {
            const cartSnap = await getDocs(collection(db, `users/${userId}/cart`));
            const hasCart = !cartSnap.empty;
            
            if (hasCart) {
              console.log(`🎯 CARRITO ENCONTRADO - Usuario: ${userId}, Items: ${cartSnap.size}`);
            }
            
            return {
              userId,
              hasCart
            };
          } catch (error) {
            console.error(`❌ Error en carrito usuario ${userId}:`, error);
            return { userId, hasCart: false };
          }
        });

        const cartResults = await Promise.all(cartCheckPromises);
        
        // 5️⃣ ANÁLISIS DE RESULTADOS
        const usersWithCart = cartResults.filter(result => result.hasCart);
        console.log("📈 RESUMEN CARRITOS:", {
          totalUsuarios: totalUsers,
          usuariosConCarrito: usersWithCart.length,
          userIdsConCarrito: usersWithCart.map(user => user.userId)
        });

        // 6️⃣ ✅ DEFINICIÓN CORREGIDA DE ABANDONO
        // Cualquier carrito activo se considera abandonado
        const abandonedCarts = cartResults.filter(result => result.hasCart);
        
        console.log("🚨 CARRITOS ABANDONADOS:", {
          total: abandonedCarts.length,
          userIds: abandonedCarts.map(user => user.userId),
          definicion: "Cualquier usuario con carrito activo"
        });

        const abandonmentRate = totalUsers > 0 ? 
          (abandonedCarts.length / totalUsers) * 100 : 0;

        console.log("🎯 TASA DE ABANDONO CALCULADA:", abandonmentRate);

        // 7️⃣ CÁLCULO DE CONVERSIÓN
        const usersWithOrders = completedUserIds.size;
        const conversionRate = totalUsers > 0 ? (usersWithOrders / totalUsers) * 100 : 0;

        // 8️⃣ CÁLCULO DE AOV Y REVENUE
        const totalRevenue = paidOrders.reduce((acc, d) => acc + (d.data().total || 0), 0);
        const totalOrders = paidOrders.length;
        const AOV = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // 9️⃣ REVENUE POR FUENTE
        const revenueMap: Record<string, number> = {};
        paidOrders.forEach((order) => {
          const { payment_method, paymentMethod, total } = order.data();
          const source = payment_method || paymentMethod || "Desconocido";
          revenueMap[source] = (revenueMap[source] || 0) + (total || 0);
        });

        const revenueBySource = Object.entries(revenueMap)
          .map(([source, value]) => ({
            source: formatPaymentSource(source),
            value,
          }))
          .sort((a, b) => b.value - a.value);

        // 🔟 ACTUALIZAR ESTADO
        setMetrics({
          conversionRate,
          AOV,
          abandonmentRate, // ← Ahora mostrará el valor correcto
          revenueBySource,
          totalRevenue,
          totalOrders,
          totalUsers,
          usersWithOrders,
          usersWithCart: abandonedCarts.length, // ← Número real de carritos abandonados
          loading: false,
          error: null,
        });

        console.log("✅ MÉTRICAS CARGADAS EXITOSAMENTE");

      } catch (error) {
        console.error("❌ ERROR:", error);
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: "Error al cargar las métricas"
        }));
      }
    };

    fetchMetrics();
  }, []);

  return metrics;
}

// Función helper para formatear fuentes de pago
function formatPaymentSource(source: string): string {
  const formatMap: Record<string, string> = {
    'card': 'Tarjeta',
    'credit_card': 'Tarjeta de Crédito',
    'debit_card': 'Tarjeta de Débito', 
    'cash': 'Efectivo',
    'transfer': 'Transferencia',
    'paypal': 'PayPal',
    'mercado_pago': 'Mercado Pago',
    'stripe': 'Stripe',
    'unknown': 'Desconocido',
    'desconocido': 'Desconocido'
  };

  return formatMap[source.toLowerCase()] || 
         source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
}