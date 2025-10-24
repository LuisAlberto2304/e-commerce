import { auth } from "@/firebase/config";

export async function syncMedusaCustomerWithFirebase() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("No hay usuario autenticado en Firebase");
  }

  try {
    const idToken = await user.getIdToken(true);
    
    console.log("🔄 Sincronizando usuario con Medusa:", {
      email: user.email,
      uid: user.uid
    });

    // ⬇️ USAR EL PROXY CORREGIDO
    const res = await fetch("/api/sync-customer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        firebaseUid: user.uid,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("❌ Error en sincronización:", errorData);
      throw new Error(errorData.error || "No se pudo sincronizar el usuario con Medusa");
    }

    const data = await res.json();
    console.log("✅ Usuario sincronizado exitosamente:", data);
    
    // ⬇️ GUARDAR TOKEN DE MEDUSA
    if (data.medusaToken) {
      localStorage.setItem('medusaToken', data.medusaToken);
      console.log("🔑 Medusa Token guardado");
    }
    
    return {
      customer: data.customer,
      medusaToken: data.medusaToken
    };
    
  } catch (error: any) {
    console.error("❌ Error completo en sincronización:", error);
    throw error;
  }
}

// ⬇️ NUEVA FUNCIÓN: Obtener customer usando Firebase Token
export async function getMedusaCustomerWithFirebaseToken() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("No hay usuario autenticado en Firebase");
  }

  try {
    const idToken = await user.getIdToken(true);
    
    const res = await fetch("/api/sync-customer", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${idToken}`
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "No se pudo obtener el customer de Medusa");
    }

    const data = await res.json();
    
    // Guardar token si viene en la respuesta
    if (data.medusaToken) {
      localStorage.setItem('medusaToken', data.medusaToken);
    }
    
    return {
      customer: data.customer,
      medusaToken: data.medusaToken
    };
    
  } catch (error: any) {
    console.error("Error obteniendo customer:", error);
    throw error;
  }
}