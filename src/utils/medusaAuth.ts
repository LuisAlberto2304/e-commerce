export async function loginMedusaCustomer(email: string, password: string) {
  const res = await fetch(
    "https://caissoned-uncorrelative-dedra.ngrok-free.app/auth/customer/emailpass",
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "",

       },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "No se pudo autenticar en Medusa");
  }

  const data = await res.json();
  // El token viene en data.access_token
  return data.access_token;
}