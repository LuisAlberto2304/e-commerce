import { auth } from "@/firebase/config";

export async function syncMedusaCustomerWithFirebase() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("No hay usuario autenticado en Firebase");
  }

  try {
    // Forzar refresh del token para asegurar que sea válido
    const idToken = await user.getIdToken(true);
    
    console.log("Sincronizando usuario con Medusa:", {
      email: user.email,
      uid: user.uid
    });

    // LLAMADA A LA RUTA INTERNA (proxy) -> evita CORS/preflight
    const res = await fetch("/api/sync-customer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}` // opcional, útil si quieres validar en el server
      },
      body: JSON.stringify({
        email: user.email,
        firebaseUid: user.uid,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Error en respuesta del proxy:", errorData);
      throw new Error(errorData.error || "No se pudo sincronizar el usuario con Medusa");
    }

    const data = await res.json();
    console.log("Usuario sincronizado exitosamente:", data);
    return data.customer;
    
  } catch (error: any) {
    console.error("Error completo en sincronización:", error);
    throw error;
  }
}